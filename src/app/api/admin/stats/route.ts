import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";

export async function GET() {
  await requireAdmin();
  const [totalCandidates, totalExams, totalAttempts, completedExams, suspiciousAttempts, results, topCandidates] = await Promise.all([
    prisma.candidate.count(),
    prisma.exam.count(),
    prisma.examAttempt.count(),
    prisma.examAttempt.count({ where: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED", "DISQUALIFIED"] } } }),
    prisma.examAttempt.count({ where: { suspiciousEventCount: { gt: 0 } } }),
    prisma.result.aggregate({ _avg: { percentage: true } }),
    prisma.result.findMany({
      take: 10,
      orderBy: { score: "desc" },
      include: { attempt: { include: { candidate: true, exam: true } } }
    })
  ]);
  const pendingCandidates = await prisma.candidate.count({ where: { attempts: { none: {} } } });
  return NextResponse.json({
    totalCandidates,
    totalExams,
    totalAttempts,
    completedExams,
    pendingCandidates,
    averageScore: results._avg.percentage || 0,
    suspiciousAttempts,
    topCandidates
  });
}
