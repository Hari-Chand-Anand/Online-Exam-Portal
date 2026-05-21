import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClearProctoringHistoryButton } from "@/components/clear-proctoring-history-button";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function clearProctoringHistory() {
  "use server";

  await prisma.proctoringEvent.deleteMany({});

  revalidatePath("/admin/proctoring");
  revalidatePath("/admin/dashboard");
}

export default async function ProctoringPage() {
  const events = await prisma.proctoringEvent.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      attempt: {
        include: {
          candidate: true,
          exam: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Proctoring / Anti-cheating Logs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review suspicious candidate activity during exams.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href="/api/admin/proctoring/export">Export CSV</a>
          </Button>

          <form action={clearProctoringHistory}>
            <ClearProctoringHistoryButton disabled={events.length === 0} />
          </form>
        </div>
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Suspicious Events
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {events.length} event(s) recorded
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 font-semibold">Candidate</th>
                <th className="px-4 py-3 font-semibold">Exam</th>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Time</th>
              </tr>
            </thead>

            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No proctoring history found.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-950">
                        {event.attempt.candidate.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {event.attempt.candidate.email}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-800">
                      {event.attempt.exam.title}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {event.eventType}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(event.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}