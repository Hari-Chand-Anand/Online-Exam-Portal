export const dynamic = "force-dynamic";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CandidateImportPage() {
  return (
    <>
      <Topbar title="Import Candidates" />
      <Card className="max-w-2xl bg-white/80">
        <CardHeader><CardTitle>Upload Candidate CSV</CardTitle><CardDescription>Format: name,email,phone,college,role_applied</CardDescription></CardHeader>
        <CardContent>
          <form action="/api/admin/candidates/import" method="post" encType="multipart/form-data" className="space-y-4">
            <Input type="file" name="file" accept=".csv" required />
            <Button>Import Candidates</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

