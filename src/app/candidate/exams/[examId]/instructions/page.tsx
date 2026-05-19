import { StartExamButton } from "@/components/start-exam-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function InstructionsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return <div className="p-8">Exam not found.</div>;
  const rules = ["Use only your own Gmail account.", "Do not switch tabs/windows.", "Do not refresh the page.", "Do not copy/paste or right-click.", "Do not use another device or another person.", "Exam has a time limit and will auto-submit when time ends.", "Suspicious activity may lead to rejection."];
  return <main className="mx-auto max-w-3xl px-4 py-10"><Card className="bg-white/90"><CardHeader><CardTitle>{exam.title} — Instructions</CardTitle></CardHeader><CardContent><ul className="space-y-3 text-sm">{rules.map(r => <li key={r} className="rounded-xl bg-muted/60 p-3">{r}</li>)}</ul><label className="mt-6 flex items-start gap-3 text-sm"><input type="checkbox" required className="mt-1" /> <span>I agree to the exam rules and understand that suspicious activity will be logged.</span></label><div className="mt-6"><StartExamButton examId={exam.id} /></div></CardContent></Card></main>;
}
