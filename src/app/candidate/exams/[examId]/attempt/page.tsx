import { ExamClient, ExamQuestionDto } from "@/components/exam-client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOrResumeAttempt } from "@/lib/exam-service";

export default async function AttemptPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const session = await auth();
  const candidate = await prisma.candidate.findUnique({ where: { email: session!.user.email! } });
  if (!candidate) return <div>Candidate not found</div>;
  const attempt = await startOrResumeAttempt({ examId, candidateId: candidate.id });
  if (!attempt || attempt.status !== "IN_PROGRESS") return <div className="p-8">Attempt is already submitted.</div>;
  const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { questions: { include: { question: { include: { options: { orderBy: { sortOrder: "asc" } } } } }, orderBy: { sortOrder: "asc" } } } });
  if (!exam) return <div>Exam not found</div>;
  const order = Array.isArray(attempt.questionOrder) ? attempt.questionOrder as string[] : exam.questions.map(eq => eq.questionId);
  const questionsMap = new Map(exam.questions.map(eq => [eq.questionId, eq.question]));
  const questions = order.map(id => questionsMap.get(id)).filter(Boolean).map((q: any) => ({ id: q.id, type: q.type, category: q.category, difficulty: q.difficulty, questionText: q.questionText, marks: q.marks, options: q.options.map((o: any) => ({ id: o.id, label: o.label, value: o.value })) })) as ExamQuestionDto[];
  const answers = await prisma.candidateAnswer.findMany({ where: { attemptId: attempt.id } });
  return <ExamClient examId={examId} attemptId={attempt.id} endTime={attempt.endTime.toISOString()} serverNow={new Date().toISOString()} questions={questions} existingAnswers={answers.map(a => ({ questionId: a.questionId, selectedOptionId: a.selectedOptionId, answerText: a.answerText, markedForReview: a.markedForReview }))} suspiciousThreshold={exam.suspiciousThreshold} />;
}
