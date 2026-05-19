import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { createQuestionAction } from "@/app/admin/actions";

export default async function QuestionsPage() {
  const questions = await prisma.question.findMany({ orderBy: { createdAt: "desc" }, include: { options: true } });
  return (
    <>
      <Topbar title="Question Bank" />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="bg-white/80"><CardHeader><CardTitle>Add Question</CardTitle></CardHeader><CardContent>
          <form action={createQuestionAction} className="space-y-3">
            <select name="type" className="h-10 w-full rounded-xl border bg-background px-3"><option>MCQ</option><option>TRUE_FALSE</option><option>SHORT_ANSWER</option><option>CODING</option></select>
            <Input name="category" placeholder="Category: Aptitude, Technical..." required />
            <select name="difficulty" className="h-10 w-full rounded-xl border bg-background px-3"><option>EASY</option><option>MEDIUM</option><option>HARD</option></select>
            <Textarea name="questionText" placeholder="Question" required />
            <div className="grid grid-cols-2 gap-2"><Input name="optionA" placeholder="Option A" /><Input name="optionB" placeholder="Option B" /><Input name="optionC" placeholder="Option C" /><Input name="optionD" placeholder="Option D" /></div>
            <Input name="correctOption" placeholder="Correct option: A/B/C/D" />
            <Textarea name="correctAnswer" placeholder="Model answer for short/coding questions" />
            <Input name="marks" type="number" step="0.25" defaultValue={1} />
            <Button className="w-full">Save Question</Button>
          </form>
          <Button asChild variant="outline" className="mt-3 w-full"><Link href="/admin/questions/import">Bulk Import CSV</Link></Button>
        </CardContent></Card>
        <Card className="bg-white/80"><CardHeader><CardTitle>All Questions</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Question</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead>Difficulty</TableHead><TableHead>Marks</TableHead></TableRow></TableHeader><TableBody>
            {questions.map(q => <TableRow key={q.id}><TableCell className="max-w-lg">{q.questionText}</TableCell><TableCell>{q.category}</TableCell><TableCell><Badge variant="secondary">{q.type}</Badge></TableCell><TableCell>{q.difficulty}</TableCell><TableCell>{q.marks}</TableCell></TableRow>)}
          </TableBody></Table>
        </CardContent></Card>
      </div>
    </>
  );
}
