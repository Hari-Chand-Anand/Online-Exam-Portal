import { Topbar } from "@/components/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { manualReviewAction } from "@/app/admin/actions";

export default async function ResultDetailPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId }, include: { candidate: true, exam: true, result: true, answers: { include: { question: { include: { options: true } }, selectedOption: true } }, proctoringEvents: { orderBy: { createdAt: "desc" } } } });
  if (!attempt) return <div>Attempt not found</div>;
  return (
    <><Topbar title="Answer Sheet" />
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="bg-white/80 lg:col-span-1"><CardHeader><CardTitle>{attempt.candidate.name}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>{attempt.candidate.email}</p><p>{attempt.exam.title}</p><p>Started: {formatDateTime(attempt.startTime)}</p><p>Submitted: {formatDateTime(attempt.submitTime)}</p><Badge>{attempt.result?.status || attempt.status}</Badge></CardContent></Card>
        <Card className="bg-white/80 lg:col-span-3"><CardHeader><CardTitle>Answers</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Question</TableHead><TableHead>Answer</TableHead><TableHead>Marks</TableHead><TableHead>Review</TableHead></TableRow></TableHeader><TableBody>
            {attempt.answers.map(a => <TableRow key={a.id}><TableCell className="max-w-lg">{a.question.questionText}<br/><span className="text-xs text-muted-foreground">{a.question.type} · {a.question.marks} marks</span></TableCell><TableCell>{a.selectedOption?.value || a.answerText || "—"}</TableCell><TableCell>{a.marksAwarded}</TableCell><TableCell>{a.question.type === "SHORT_ANSWER" || a.question.type === "CODING" ? <form action={manualReviewAction.bind(null, a.id, attempt.id)} className="flex gap-2"><Input name="marksAwarded" type="number" step="0.25" defaultValue={a.marksAwarded} className="w-24" /><Button size="sm">Save</Button></form> : a.isCorrect ? "Correct" : "Wrong"}</TableCell></TableRow>)}
          </TableBody></Table>
        </CardContent></Card>
      </div>
      <Card className="mt-6 bg-white/80"><CardHeader><CardTitle>Proctoring Events</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Time</TableHead><TableHead>Metadata</TableHead></TableRow></TableHeader><TableBody>{attempt.proctoringEvents.map(e => <TableRow key={e.id}><TableCell>{e.eventType}</TableCell><TableCell>{formatDateTime(e.createdAt)}</TableCell><TableCell>{JSON.stringify(e.metadata)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </>
  );
}
