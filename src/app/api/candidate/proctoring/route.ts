import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireCandidate } from "@/lib/rbac";
import { getCandidateByEmail, logProctoringEvent } from "@/lib/exam-service";
import { proctoringEventSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await requireCandidate();
  const candidate = await getCandidateByEmail(session.user.email!);
  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  const payload = proctoringEventSchema.parse(await req.json());
  const attempt = await logProctoringEvent({
    attemptId: payload.attemptId,
    candidateId: candidate.id,
    eventType: payload.eventType,
    metadata: payload.metadata as Prisma.JsonObject | undefined,
  });
  return NextResponse.json(attempt);
}

