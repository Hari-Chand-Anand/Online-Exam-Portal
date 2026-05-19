export const dynamic = "force-dynamic";
import { Topbar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { BarChart3, CheckCircle2, ClipboardList, ShieldAlert, Users } from "lucide-react";

export default async function AdminDashboardPage() {
  const [totalCandidates, totalExams, totalAttempts, completed, suspicious, avg, top] = await Promise.all([
    prisma.candidate.count(),
    prisma.exam.count(),
    prisma.examAttempt.count(),
    prisma.examAttempt.count({ where: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED", "DISQUALIFIED"] } } }),
    prisma.examAttempt.count({ where: { suspiciousEventCount: { gt: 0 } } }),
    prisma.result.aggregate({ _avg: { percentage: true } }),
    prisma.result.findMany({ take: 10, orderBy: { score: "desc" }, include: { attempt: { include: { candidate: true, exam: true } } } })
  ]);
  const pendingCandidates = await prisma.candidate.count({ where: { attempts: { none: {} } } });
  return (
    <>
      <Topbar title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Candidates" value={totalCandidates} icon={Users} />
        <StatCard title="Exams" value={totalExams} icon={ClipboardList} />
        <StatCard title="Attempts" value={totalAttempts} icon={BarChart3} />
        <StatCard title="Completed" value={completed} icon={CheckCircle2} />
        <StatCard title="Pending" value={pendingCandidates} icon={Users} />
        <StatCard title="Suspicious" value={suspicious} icon={ShieldAlert} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 bg-white/80">
          <CardHeader><CardTitle>Top 10 Candidates</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Exam</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {top.map((r) => <TableRow key={r.id}><TableCell>{r.attempt.candidate.name}</TableCell><TableCell>{r.attempt.exam.title}</TableCell><TableCell>{r.score}</TableCell><TableCell>{r.status}</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="bg-white/80">
          <CardHeader><CardTitle>Average Score</CardTitle></CardHeader>
          <CardContent>
            <p className="text-5xl font-semibold">{(avg._avg.percentage || 0).toFixed(1)}%</p>
            <p className="mt-2 text-sm text-muted-foreground">Average percentage across submitted results.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

