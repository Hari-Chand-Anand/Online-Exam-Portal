import { NextResponse } from "next/server";
import { requireCandidate } from "@/lib/rbac";
import { getCandidateByEmail, startOrResumeAttempt } from "@/lib/exam-service";

export async function POST(req: Request) {
  const session = await requireCandidate();
  const { examId } = await req.json();
  const candidate = await getCandidateByEmail(session.user.email!);
  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  const attempt = await startOrResumeAttempt({
    examId,
    candidateId: candidate.id,
    ipAddress: req.headers.get("x-forwarded-for") || null,
    userAgent: req.headers.get("user-agent") || null
  });
  return NextResponse.json(attempt);
}
