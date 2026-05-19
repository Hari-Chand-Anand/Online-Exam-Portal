import { NextResponse } from "next/server";
import { requireCandidate } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getCandidateByEmail, submitAttempt } from "@/lib/exam-service";

export async function POST(req: Request) {
  const session = await requireCandidate();
  const candidate = await getCandidateByEmail(session.user.email!);
  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  const { attemptId } = await req.json();
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.candidateId !== candidate.id) return NextResponse.json({ error: "Invalid attempt" }, { status: 403 });
  const submitted = await submitAttempt(attemptId, new Date() > attempt.endTime ? "AUTO_SUBMITTED" : "SUBMITTED");
  return NextResponse.json(submitted);
}
