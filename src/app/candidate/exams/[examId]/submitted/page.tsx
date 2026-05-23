import Link from "next/link";
import { requireCandidate } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function formatScore(value: number | null | undefined) {
  if (value === null || value === undefined) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export default async function SubmittedPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;

  const session = await requireCandidate();
  const email = session.user.email?.toLowerCase();

  const candidate = email
    ? await prisma.candidate.findUnique({
        where: { email },
      })
    : null;

  const attempt = candidate
    ? await prisma.examAttempt.findFirst({
        where: {
          examId,
          candidateId: candidate.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          exam: true,
          result: true,
        },
      })
    : null;

  const showScore =
    attempt?.result &&
    (attempt.exam.showResultToCandidate || attempt.result.score !== null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">
          Exam submitted successfully
        </h1>

        {showScore ? (
          <div className="mt-6">
            <p className="text-3xl font-bold text-slate-950">
              Score: {formatScore(attempt.result?.score)} /{" "}
              {formatScore(attempt.exam.totalMarks)}
            </p>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Powered by{" "}
              <span className="font-semibold text-slate-950">HCA</span>
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-muted-foreground">
              Result will be reviewed by admin.
            </p>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Powered by{" "}
              <span className="font-semibold text-slate-950">HCA</span>
            </p>
          </div>
        )}

        <Button asChild className="mt-6 bg-slate-950 hover:bg-slate-800">
          <Link href="/candidate/dashboard">Back to Dashboard</Link>
        </Button>
      </Card>
    </main>
  );
}