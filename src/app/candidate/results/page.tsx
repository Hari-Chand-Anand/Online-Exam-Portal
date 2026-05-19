import Link from "next/link";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function CandidateResultsPage() {
  const session = await auth();
  const candidate = await prisma.candidate.findUnique({ where: { email: session!.user.email! } });
  const attempts = candidate ? await prisma.examAttempt.findMany({ where: { candidateId: candidate.id }, include: { exam: true, result: true }, orderBy: { createdAt: "desc" } }) : [];
  return <main className="mx-auto max-w-5xl px-4 py-8"><div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-semibold">My Results</h1><Button asChild variant="outline"><Link href="/candidate/dashboard">Dashboard</Link></Button></div><Card className="bg-white/80"><CardHeader><CardTitle>Submissions</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Status</TableHead><TableHead>Score</TableHead><TableHead>Submitted</TableHead></TableRow></TableHeader><TableBody>{attempts.map(a => <TableRow key={a.id}><TableCell>{a.exam.title}</TableCell><TableCell><Badge>{a.result?.status || a.status}</Badge></TableCell><TableCell>{a.exam.showResultToCandidate && a.result ? `${a.result.score}/${a.exam.totalMarks}` : "Hidden"}</TableCell><TableCell>{formatDateTime(a.submitTime)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></main>;
}
