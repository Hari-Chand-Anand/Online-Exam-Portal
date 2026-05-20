import { NextResponse } from "next/server";
import { requireCandidate } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getCandidateByEmail, submitAttempt } from "@/lib/exam-service";

function isAnswered(answer: { selectedOptionId: string | null; answerText: string | null }) {
  return Boolean(
    answer.selectedOptionId ||
    (answer.answerText && answer.answerText.trim().length > 0)
  );
}

export async function POST(req: Request) {
  const session = await requireCandidate();

  const candidate = await getCandidateByEmail(session.user.email!);

  if (!candidate) {
    return NextResponse.json(
      { error: "Candidate not found" },
      { status: 404 }
    );
  }

  const { attemptId } = await req.json();

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          questions: true,
        },
      },
      answers: true,
    },
  });

  if (!attempt || attempt.candidateId !== candidate.id) {
    return NextResponse.json(
      { error: "Invalid attempt" },
      { status: 403 }
    );
  }

  if (attempt.status !== "IN_PROGRESS") {
    return NextResponse.json(attempt);
  }

  const now = new Date();
  const timeOver = now > attempt.endTime;

  const totalQuestions = attempt.exam.questions.length;
  const answeredCount = attempt.answers.filter(isAnswered).length;
  const missingCount = totalQuestions - answeredCount;

  // Manual submit is blocked until all questions are attempted.
  // Auto-submit is still allowed when the server-side timer is over.
  if (!timeOver && missingCount > 0) {
    return NextResponse.json(
      {
        error: `Please attempt all ${totalQuestions} questions before submitting.`,
        totalQuestions,
        answeredCount,
        missingCount,
      },
      { status: 400 }
    );
  }

  const submitted = await submitAttempt(
    attemptId,
    timeOver ? "AUTO_SUBMITTED" : "SUBMITTED"
  );

  return NextResponse.json(submitted);
}
