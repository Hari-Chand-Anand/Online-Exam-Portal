import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function QuestionImportPage() {
  return (
    <><Topbar title="Import Questions" />
      <Card className="max-w-2xl bg-white/80"><CardHeader><CardTitle>Upload Question CSV</CardTitle><CardDescription>category,difficulty,type,question,option_a,option_b,option_c,option_d,correct_option,marks</CardDescription></CardHeader><CardContent>
        <form action="/api/admin/questions/import" method="post" encType="multipart/form-data" className="space-y-4"><Input type="file" name="file" accept=".csv" required /><Button>Import Questions</Button></form>
      </CardContent></Card>
    </>
  );
}
