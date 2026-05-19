import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function SubmittedPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const session = await auth();
  const candidate = await prisma.candidate.findUnique({ where: { email: session!.user.email! } });
  const attempt = candidate ? await prisma.examAttempt.findFirst({ where: { examId, candidateId: candidate.id }, orderBy: { createdAt: "desc" }, include: { result: true, exam: true } }) : null;
  return <main className="flex min-h-screen items-center justify-center px-4"><Card className="max-w-lg bg-white/90 text-center"><CardHeader><CardTitle>Exam submitted successfully</CardTitle></CardHeader><CardContent className="space-y-4">{attempt?.exam.showResultToCandidate && attempt.result ? <p className="text-2xl font-semibold">Score: {attempt.result.score} / {attempt.exam.totalMarks}</p> : <p className="text-muted-foreground">Result will be reviewed by admin.</p>}<Button asChild><Link href="/candidate/dashboard">Back to Dashboard</Link></Button></CardContent></Card></main>;
}
