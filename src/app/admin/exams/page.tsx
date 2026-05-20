import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null) {
  if (!date) return "Not set";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ExamsPage() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      questions: true,
      attempts: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Exam Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, publish, and manage intern exams.
          </p>
        </div>

        <Button asChild className="bg-violet-600 hover:bg-violet-700">
          <Link href="/admin/exams/create">+ Create Exam</Link>
        </Button>
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-950">Exams</h2>
          <p className="text-sm text-slate-500">{exams.length} exams</p>
        </div>

        <div className="space-y-4">
          {exams.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
              <h3 className="font-semibold text-slate-900">No exams found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Create your first exam to start testing candidates.
              </p>
            </div>
          ) : (
            exams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:bg-slate-50"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">
                      {exam.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {exam.status}
                      </span>

                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                        {exam.durationMinutes} min
                      </span>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {exam.questions.length} Questions
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Attempts: {exam.attempts.length}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      {formatDate(exam.startTime)} → {formatDate(exam.endTime)}
                    </p>
                  </div>

                  <Button asChild variant="outline">
                    <Link href={`/admin/exams/${exam.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
