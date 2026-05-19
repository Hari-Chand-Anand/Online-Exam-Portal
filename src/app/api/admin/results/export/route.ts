import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { toCsv } from "@/lib/utils";

export async function GET(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId") || undefined;
  const results = await prisma.result.findMany({
    where: examId ? { attempt: { examId } } : {},
    include: { attempt: { include: { candidate: true, exam: true } } },
    orderBy: { score: "desc" }
  });
  const csv = toCsv(results.map((r) => ({
    candidate_name: r.attempt.candidate.name,
    email: r.attempt.candidate.email,
    exam: r.attempt.exam.title,
    score: r.score,
    percentage: r.percentage.toFixed(2),
    status: r.status,
    correct: r.correctCount,
    wrong: r.wrongCount,
    unanswered: r.unansweredCount,
    suspicious_events: r.attempt.suspiciousEventCount,
    started_at: r.attempt.startTime.toISOString(),
    submitted_at: r.attempt.submitTime?.toISOString() || ""
  })));
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=results.csv" } });
}
