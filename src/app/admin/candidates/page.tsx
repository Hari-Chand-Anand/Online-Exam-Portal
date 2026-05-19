export const dynamic = "force-dynamic";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { createCandidateAction, toggleCandidateAction } from "@/app/admin/actions";

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const candidates = await prisma.candidate.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { college: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { attempts: true } } }
  });
  return (
    <>
      <Topbar title="Candidate Management" />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="bg-white/80">
          <CardHeader><CardTitle>Add Candidate</CardTitle></CardHeader>
          <CardContent>
            <form action={createCandidateAction} className="space-y-3">
              <Input name="name" placeholder="Name" required />
              <Input name="email" placeholder="Email" type="email" required />
              <Input name="phone" placeholder="Phone" />
              <Input name="college" placeholder="College" />
              <Input name="roleApplied" placeholder="Role applied" />
              <select name="status" className="h-10 w-full rounded-xl border bg-background px-3 text-sm"><option>ACTIVE</option><option>INACTIVE</option><option>BLOCKED</option></select>
              <Button className="w-full">Save Candidate</Button>
            </form>
            <Button asChild variant="outline" className="mt-3 w-full"><Link href="/admin/candidates/import">Bulk Import CSV</Link></Button>
          </CardContent>
        </Card>
        <Card className="bg-white/80">
          <CardHeader className="flex-row items-center justify-between gap-4"><CardTitle>All Candidates</CardTitle><Button asChild variant="outline" size="sm"><a href="/api/admin/candidates/export">Export CSV</a></Button></CardHeader>
          <CardContent>
            <form className="mb-4 flex gap-2"><Input name="q" placeholder="Search name, email, college" defaultValue={q} /><Button variant="outline">Search</Button></form>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>College</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Attempts</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {candidates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell><TableCell>{c.email}</TableCell><TableCell>{c.college || "—"}</TableCell><TableCell>{c.roleApplied || "—"}</TableCell>
                    <TableCell><Badge variant={c.status === "ACTIVE" ? "success" : "warning"}>{c.status}</Badge></TableCell><TableCell>{c._count.attempts}</TableCell>
                    <TableCell>
                      <form action={async () => { "use server"; await toggleCandidateAction(c.id, c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"); }}>
                        <Button variant="outline" size="sm">{c.status === "ACTIVE" ? "Deactivate" : "Activate"}</Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

