import { NextResponse } from "next/server";
import { requireCandidate } from "@/lib/rbac";
import { getCandidateByEmail, saveAnswer } from "@/lib/exam-service";
import { saveAnswerSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await requireCandidate();
  const candidate = await getCandidateByEmail(session.user.email!);
  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  const payload = saveAnswerSchema.parse(await req.json());
  const answer = await saveAnswer({ ...payload, candidateId: candidate.id });
  return NextResponse.json(answer);
}
