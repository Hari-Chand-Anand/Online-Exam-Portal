import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export function StatCard({ title, value, icon: Icon, sub }: { title: string; value: string | number; icon: LucideIcon; sub?: string }) {
  return (
    <Card className="overflow-hidden border-slate-200/70 bg-white/80 backdrop-blur">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-sm"><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
