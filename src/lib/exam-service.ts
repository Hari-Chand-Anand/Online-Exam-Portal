import { AttemptStatus, Prisma, QuestionType, ResultStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { shuffle } from "@/lib/utils";

export async function getCandidateByEmail(email: string) {
  return prisma.candidate.findUnique({ where: { email: email.toLowerCase() } });
}

export async function getExamForCandidate(examId: string, candidateId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { assignments: { where: { candidateId } } }
  });
  if (!exam || exam.status !== "PUBLISHED") return null;
  if (!exam.assignToAllCandidates && exam.assignments.length === 0) return null;
  const now = new Date();
  if (exam.startTime && now < exam.startTime) return null;
  if (exam.endTime && now > exam.endTime) return null;
  return exam;
}

export async function startOrResumeAttempt(params: { examId: string; candidateId: string; ipAddress?: string | null; userAgent?: string | null }) {
  const exam = await getExamForCandidate(params.examId, params.candidateId);
  if (!exam) throw new Error("Exam is not available or you are not assigned.");

  const active = await prisma.examAttempt.findFirst({
    where: { examId: params.examId, candidateId: params.candidateId, status: "IN_PROGRESS" },
    include: { result: true }
  });
  if (active) {
    if (new Date() > active.endTime) return submitAttempt(active.id, "AUTO_SUBMITTED");
    return active;
  }

  const completedAttempts = await prisma.examAttempt.count({
    where: { examId: params.examId, candidateId: params.candidateId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED", "DISQUALIFIED", "EXPIRED"] } }
  });
  if (completedAttempts >= exam.maxAttempts) throw new Error("Maximum attempt limit reached.");

  const examQuestions = await prisma.examQuestion.findMany({
    where: { examId: params.examId },
    orderBy: { sortOrder: "asc" },
    include: { question: true }
  });
  const ordered = exam.randomQuestionOrderEnabled ? shuffle(examQuestions) : examQuestions;
  const questionOrder = ordered.map((eq) => eq.questionId);
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + exam.durationMinutes * 60_000);
  const hardEnd = exam.endTime && exam.endTime < endTime ? exam.endTime : endTime;

  return prisma.examAttempt.create({
    data: {
      examId: params.examId,
      candidateId: params.candidateId,
      startTime,
      endTime: hardEnd,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      questionOrder
    }
  });
}

export async function saveAnswer(params: { attemptId: string; candidateId: string; questionId: string; selectedOptionId?: string | null; answerText?: string | null; markedForReview?: boolean }) {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: params.attemptId } });
  if (!attempt || attempt.candidateId !== params.candidateId) throw new Error("Invalid attempt.");
  if (attempt.status !== "IN_PROGRESS") throw new Error("Attempt is already submitted.");
  if (new Date() > attempt.endTime) {
    await submitAttempt(attempt.id, "AUTO_SUBMITTED");
    throw new Error("Time is over. Attempt has been submitted.");
  }
  return prisma.candidateAnswer.upsert({
    where: { attemptId_questionId: { attemptId: params.attemptId, questionId: params.questionId } },
    update: {
      selectedOptionId: params.selectedOptionId || null,
      answerText: params.answerText || null,
      markedForReview: params.markedForReview || false
    },
    create: {
      attemptId: params.attemptId,
      questionId: params.questionId,
      selectedOptionId: params.selectedOptionId || null,
      answerText: params.answerText || null,
      markedForReview: params.markedForReview || false
    }
  });
}

export async function logProctoringEvent(params: { attemptId: string; candidateId: string; eventType: any; metadata?: Prisma.JsonObject }) {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: params.attemptId }, include: { exam: true } });
  if (!attempt || attempt.candidateId !== params.candidateId) throw new Error("Invalid attempt.");
  if (attempt.status !== "IN_PROGRESS") return attempt;

  const threshold = attempt.exam.suspiciousThreshold;
  const updated = await prisma.$transaction(async (tx) => {
    await tx.proctoringEvent.create({ data: { attemptId: params.attemptId, eventType: params.eventType, metadata: params.metadata || {} } });
    const next = await tx.examAttempt.update({
      where: { id: params.attemptId },
      data: { suspiciousEventCount: { increment: 1 }, warningCount: { increment: 1 } }
    });
    return next;
  });

  if (updated.suspiciousEventCount >= threshold) {
    await submitAttempt(updated.id, "DISQUALIFIED");
  }
  return updated;
}

export async function submitAttempt(attemptId: string, status: AttemptStatus | "SUBMITTED" | "AUTO_SUBMITTED" | "DISQUALIFIED" = "SUBMITTED") {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { include: { questions: { include: { question: { include: { options: true } } } } } },
      answers: { include: { question: { include: { options: true } }, selectedOption: true } }
    }
  });
  if (!attempt) throw new Error("Attempt not found.");
  if (attempt.status !== "IN_PROGRESS") return attempt;

  const questions = attempt.exam.questions.map((eq) => eq.question);
  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let subjectivePending = false;

  await prisma.$transaction(async (tx) => {
    for (const question of questions) {
      const answer = attempt.answers.find((a) => a.questionId === question.id);
      if (!answer || (!answer.selectedOptionId && !answer.answerText)) {
        unansweredCount++;
        continue;
      }

      if (question.type === QuestionType.MCQ || question.type === QuestionType.TRUE_FALSE) {
        const correctOption = question.options.find((o) => o.isCorrect);
        const isCorrect = Boolean(correctOption && answer.selectedOptionId === correctOption.id);
        const marksAwarded = isCorrect ? question.marks : attempt.exam.negativeMarkingEnabled ? -attempt.exam.negativeMarks : 0;
        score += marksAwarded;
        if (isCorrect) correctCount++; else wrongCount++;
        await tx.candidateAnswer.update({ where: { id: answer.id }, data: { isCorrect, marksAwarded } });
      } else {
        subjectivePending = true;
        await tx.candidateAnswer.update({ where: { id: answer.id }, data: { isCorrect: null, marksAwarded: 0 } });
      }
    }

    const percentage = attempt.exam.totalMarks > 0 ? Math.max(0, (score / attempt.exam.totalMarks) * 100) : 0;
    const resultStatus = status === "DISQUALIFIED"
      ? ResultStatus.DISQUALIFIED
      : subjectivePending
        ? ResultStatus.PENDING_REVIEW
        : score >= attempt.exam.passingMarks ? ResultStatus.PASSED : ResultStatus.FAILED;

    await tx.examAttempt.update({ where: { id: attemptId }, data: { status: status as AttemptStatus, submitTime: new Date() } });
    await tx.result.upsert({
      where: { attemptId },
      create: { attemptId, score, percentage, status: resultStatus, correctCount, wrongCount, unansweredCount, subjectivePending },
      update: { score, percentage, status: resultStatus, correctCount, wrongCount, unansweredCount, subjectivePending }
    });
  });

  return prisma.examAttempt.findUnique({ where: { id: attemptId }, include: { result: true } });
}

export async function refreshRanks(examId: string) {
  const results = await prisma.result.findMany({
    where: { attempt: { examId }, status: { in: ["PASSED", "FAILED", "PENDING_REVIEW"] } },
    orderBy: [{ score: "desc" }, { percentage: "desc" }, { createdAt: "asc" }]
  });
  await prisma.$transaction(results.map((result, index) => prisma.result.update({ where: { id: result.id }, data: { rank: index + 1 } })));
}
