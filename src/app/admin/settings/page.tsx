import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma";
import { saveSettingsAction } from "@/app/admin/actions";

export default async function SettingsPage() {
  const setting = await prisma.setting.findFirst();
  return <><Topbar title="Settings" /><Card className="max-w-3xl bg-white/80"><CardHeader><CardTitle>Company & Exam Settings</CardTitle></CardHeader><CardContent><form action={saveSettingsAction} className="space-y-4"><Input name="companyName" placeholder="Company name" defaultValue={setting?.companyName || ""} /><Input name="logoUrl" placeholder="Logo URL" defaultValue={setting?.logoUrl || ""} /><Textarea name="examRules" defaultValue={setting?.examRules || ""} /><Input name="suspiciousActivityThreshold" type="number" defaultValue={setting?.suspiciousActivityThreshold || 6} /><label className="flex items-center gap-2"><input type="checkbox" name="showResultToCandidateDefault" defaultChecked={setting?.showResultToCandidateDefault || false} /> Show results to candidates by default</label><label className="flex items-center gap-2"><input type="checkbox" name="emailNotificationsEnabled" defaultChecked={setting?.emailNotificationsEnabled || false} /> Enable email notifications</label><Button>Save Settings</Button></form></CardContent></Card></>;
}
