import { Topbar } from "@/components/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { attachQuestionAction, assignCandidateAction, updateExamAction } from "@/app/admin/actions";

function localDate(value?: Date | null) {
  if (!value) return "";
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [exam, questions, candidates] = await Promise.all([
    prisma.exam.findUnique({ where: { id }, include: { questions: { include: { question: { include: { options: true } } }, orderBy: { sortOrder: "asc" } }, assignments: { include: { candidate: true } } } }),
    prisma.question.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.candidate.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } })
  ]);
  if (!exam) return <div>Exam not found</div>;
  return (
    <>
      <Topbar title={`Edit Exam: ${exam.title}`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card className="bg-white/80"><CardHeader><CardTitle>Exam Details</CardTitle></CardHeader><CardContent>
          <form action={updateExamAction.bind(null, exam.id)} className="grid gap-4 md:grid-cols-2">
            <Input name="title" defaultValue={exam.title} className="md:col-span-2" />
            <Textarea name="description" defaultValue={exam.description || ""} className="md:col-span-2" />
            <Input name="durationMinutes" type="number" defaultValue={exam.durationMinutes} />
            <Input name="totalMarks" type="number" defaultValue={exam.totalMarks} />
            <Input name="passingMarks" type="number" defaultValue={exam.passingMarks} />
            <Input name="maxAttempts" type="number" defaultValue={exam.maxAttempts} />
            <Input name="startTime" type="datetime-local" defaultValue={localDate(exam.startTime)} />
            <Input name="endTime" type="datetime-local" defaultValue={localDate(exam.endTime)} />
            <Input name="negativeMarks" type="number" step="0.25" defaultValue={exam.negativeMarks} />
            <Input name="suspiciousThreshold" type="number" defaultValue={exam.suspiciousThreshold} />
            <label className="flex items-center gap-2"><input type="checkbox" name="negativeMarkingEnabled" defaultChecked={exam.negativeMarkingEnabled} /> Negative marking</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="randomQuestionOrderEnabled" defaultChecked={exam.randomQuestionOrderEnabled} /> Random questions</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="shuffleOptionsEnabled" defaultChecked={exam.shuffleOptionsEnabled} /> Shuffle options</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="assignToAllCandidates" defaultChecked={exam.assignToAllCandidates} /> Assign to all</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="showResultToCandidate" defaultChecked={exam.showResultToCandidate} /> Show result</label>
            <select name="status" defaultValue={exam.status} className="h-10 rounded-xl border bg-background px-3"><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select>
            <Button className="md:col-span-2">Save Changes</Button>
          </form>
        </CardContent></Card>
        <div className="space-y-6">
          <Card className="bg-white/80"><CardHeader><CardTitle>Add Question</CardTitle></CardHeader><CardContent>
            <form action={attachQuestionAction.bind(null, exam.id)} className="flex gap-2">
              <select name="questionId" className="min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm">
                {questions.map(q => <option key={q.id} value={q.id}>{q.category} · {q.questionText.slice(0, 55)}</option>)}
              </select>
              <Button>Add</Button>
            </form>
          </CardContent></Card>
          <Card className="bg-white/80"><CardHeader><CardTitle>Assign Candidate</CardTitle></CardHeader><CardContent>
            <form action={assignCandidateAction.bind(null, exam.id)} className="flex gap-2">
              <select name="candidateId" className="min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm">
                {candidates.map(c => <option key={c.id} value={c.id}>{c.name} · {c.email}</option>)}
              </select>
              <Button>Assign</Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">Assigned: {exam.assignments.length}. If “Assign to all” is enabled, all active candidates can attempt.</p>
          </CardContent></Card>
        </div>
      </div>
      <Card className="mt-6 bg-white/80"><CardHeader><CardTitle>Questions in Exam</CardTitle></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Question</TableHead><TableHead>Type</TableHead><TableHead>Marks</TableHead></TableRow></TableHeader><TableBody>
          {exam.questions.map((eq, i) => <TableRow key={eq.id}><TableCell>{i + 1}</TableCell><TableCell>{eq.question.questionText}</TableCell><TableCell><Badge variant="secondary">{eq.question.type}</Badge></TableCell><TableCell>{eq.question.marks}</TableCell></TableRow>)}
        </TableBody></Table>
      </CardContent></Card>
    </>
  );
}
