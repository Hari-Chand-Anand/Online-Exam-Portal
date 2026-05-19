import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { toCsv } from "@/lib/utils";

export async function GET() {
  await requireAdmin();
  const events = await prisma.proctoringEvent.findMany({ include: { attempt: { include: { candidate: true, exam: true } } }, orderBy: { createdAt: "desc" } });
  const csv = toCsv(events.map((e) => ({ candidate: e.attempt.candidate.name, email: e.attempt.candidate.email, exam: e.attempt.exam.title, event_type: e.eventType, time: e.createdAt.toISOString(), metadata: JSON.stringify(e.metadata || {}) })));
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=suspicious-activity.csv" } });
}
