export const dynamic = "force-dynamic";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function ProctoringPage() {
  const events = await prisma.proctoringEvent.findMany({ take: 200, orderBy: { createdAt: "desc" }, include: { attempt: { include: { candidate: true, exam: true } } } });
  return <><Topbar title="Proctoring / Anti-cheating Logs" /><Card className="bg-white/80"><CardHeader className="flex-row items-center justify-between"><CardTitle>Suspicious Events</CardTitle><Button asChild variant="outline"><a href="/api/admin/proctoring/export">Export CSV</a></Button></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Candidate</TableHead><TableHead>Exam</TableHead><TableHead>Event</TableHead><TableHead>Time</TableHead></TableRow></TableHeader><TableBody>{events.map(e => <TableRow key={e.id}><TableCell>{e.attempt.candidate.name}<br/><span className="text-xs text-muted-foreground">{e.attempt.candidate.email}</span></TableCell><TableCell>{e.attempt.exam.title}</TableCell><TableCell>{e.eventType}</TableCell><TableCell>{formatDateTime(e.createdAt)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></>;
}

