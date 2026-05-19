import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function ExamsPage() {
  const exams = await prisma.exam.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { questions: true, assignments: true, attempts: true } } } });
  return (
    <>
      <Topbar title="Exam Management" />
      <Card className="bg-white/80">
        <CardHeader className="flex-row items-center justify-between"><CardTitle>Exams</CardTitle><Button asChild><Link href="/admin/exams/create">Create Exam</Link></Button></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Window</TableHead><TableHead>Duration</TableHead><TableHead>Questions</TableHead><TableHead>Attempts</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {exams.map((e) => <TableRow key={e.id}><TableCell className="font-medium">{e.title}</TableCell><TableCell><Badge variant={e.status === "PUBLISHED" ? "success" : "secondary"}>{e.status}</Badge></TableCell><TableCell>{formatDateTime(e.startTime)} → {formatDateTime(e.endTime)}</TableCell><TableCell>{e.durationMinutes} min</TableCell><TableCell>{e._count.questions}</TableCell><TableCell>{e._count.attempts}</TableCell><TableCell><Button asChild variant="outline" size="sm"><Link href={`/admin/exams/${e.id}/edit`}>Edit</Link></Button></TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
