export const dynamic = "force-dynamic";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function ResultsPage() {
  const results = await prisma.result.findMany({ orderBy: { createdAt: "desc" }, include: { attempt: { include: { candidate: true, exam: true } } } });
  return (
    <><Topbar title="Results" />
      <Card className="bg-white/80"><CardHeader className="flex-row items-center justify-between"><CardTitle>All Results</CardTitle><Button asChild variant="outline"><a href="/api/admin/results/export">Export Results CSV</a></Button></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>Candidate</TableHead><TableHead>Exam</TableHead><TableHead>Score</TableHead><TableHead>%</TableHead><TableHead>Status</TableHead><TableHead>Suspicious</TableHead><TableHead>Submitted</TableHead><TableHead></TableHead></TableRow></TableHeader><TableBody>
          {results.map(r => <TableRow key={r.id}><TableCell>{r.attempt.candidate.name}<br/><span className="text-xs text-muted-foreground">{r.attempt.candidate.email}</span></TableCell><TableCell>{r.attempt.exam.title}</TableCell><TableCell>{r.score}</TableCell><TableCell>{r.percentage.toFixed(1)}%</TableCell><TableCell><Badge variant={r.status === "PASSED" ? "success" : r.status === "FAILED" ? "warning" : r.status === "DISQUALIFIED" ? "destructive" : "secondary"}>{r.status}</Badge></TableCell><TableCell>{r.attempt.suspiciousEventCount}</TableCell><TableCell>{formatDateTime(r.attempt.submitTime)}</TableCell><TableCell><Button asChild variant="outline" size="sm"><Link href={`/admin/results/${r.attemptId}`}>View</Link></Button></TableCell></TableRow>)}
        </TableBody></Table>
      </CardContent></Card>
    </>
  );
}

