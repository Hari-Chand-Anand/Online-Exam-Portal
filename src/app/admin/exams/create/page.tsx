export const dynamic = "force-dynamic";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createExamAction } from "@/app/admin/actions";

export default function CreateExamPage() {
  return (
    <>
      <Topbar title="Create Exam" />
      <Card className="max-w-3xl bg-white/80"><CardHeader><CardTitle>Exam Details</CardTitle></CardHeader><CardContent>
        <form action={createExamAction} className="grid gap-4 md:grid-cols-2">
          <Input name="title" placeholder="Exam title" required className="md:col-span-2" />
          <Textarea name="description" placeholder="Description" className="md:col-span-2" />
          <Input name="durationMinutes" type="number" placeholder="Duration minutes" defaultValue={45} required />
          <Input name="totalMarks" type="number" placeholder="Total marks" defaultValue={50} required />
          <Input name="passingMarks" type="number" placeholder="Passing marks" defaultValue={25} required />
          <Input name="maxAttempts" type="number" placeholder="Max attempts" defaultValue={1} />
          <Input name="startTime" type="datetime-local" />
          <Input name="endTime" type="datetime-local" />
          <Input name="negativeMarks" type="number" step="0.25" placeholder="Negative marks" defaultValue={0} />
          <Input name="suspiciousThreshold" type="number" placeholder="Suspicious threshold" defaultValue={6} />
          <label className="flex items-center gap-2"><input type="checkbox" name="negativeMarkingEnabled" /> Negative marking</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="randomQuestionOrderEnabled" defaultChecked /> Random questions</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="shuffleOptionsEnabled" defaultChecked /> Shuffle options</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="assignToAllCandidates" /> Assign to all candidates</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="showResultToCandidate" /> Show result to candidate</label>
          <select name="status" className="h-10 rounded-xl border bg-background px-3"><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select>
          <Button className="md:col-span-2">Create Exam</Button>
        </form>
      </CardContent></Card>
    </>
  );
}

