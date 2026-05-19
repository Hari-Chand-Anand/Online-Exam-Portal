import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function CandidateDashboardPage() {
  const session = await auth();
  const candidate = await prisma.candidate.findUnique({ where: { email: session!.user.email! } });
  if (!candidate) return <div className="p-8">Candidate record not found.</div>;
  const exams = await prisma.exam.findMany({
    where: { status: "PUBLISHED", OR: [{ assignToAllCandidates: true }, { assignments: { some: { candidateId: candidate.id } } }] },
    orderBy: { createdAt: "desc" },
    include: { attempts: { where: { candidateId: candidate.id }, include: { result: true } }, _count: { select: { questions: true } } }
  });
  const now = new Date();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between"><div><h1 className="text-3xl font-semibold">Welcome, {candidate.name}</h1><p className="text-muted-foreground">Available exams assigned to your Gmail account.</p></div><form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}><Button variant="outline">Logout</Button></form></header>
      <div className="grid gap-4 md:grid-cols-2">
        {exams.map((exam) => {
          const latest = exam.attempts[0];
          const expired = exam.endTime && now > exam.endTime;
          const notStarted = exam.startTime && now < exam.startTime;
          const status = latest?.status || (expired ? "EXPIRED" : notStarted ? "NOT_STARTED" : "AVAILABLE");
          return <Card key={exam.id} className="bg-white/80"><CardHeader><div className="flex items-center justify-between"><CardTitle>{exam.title}</CardTitle><Badge variant={status === "AVAILABLE" ? "success" : "secondary"}>{status}</Badge></div></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{exam.description}</p><div className="grid grid-cols-2 gap-3 text-sm"><p>Duration: {exam.durationMinutes} min</p><p>Marks: {exam.totalMarks}</p><p>Start: {formatDateTime(exam.startTime)}</p><p>End: {formatDateTime(exam.endTime)}</p><p>Questions: {exam._count.questions}</p><p>Attempts: {exam.attempts.length}/{exam.maxAttempts}</p></div>{latest?.result ? <Button asChild variant="outline"><Link href="/candidate/results">View Submission</Link></Button> : <Button asChild disabled={Boolean(expired || notStarted)}><Link href={`/candidate/exams/${exam.id}/instructions`}>Start Instructions</Link></Button>}</CardContent></Card>;
        })}
      </div>
    </main>
  );
}
