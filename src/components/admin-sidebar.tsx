import Link from "next/link";
import { BarChart3, FileQuestion, GraduationCap, LayoutDashboard, ListChecks, Settings, ShieldAlert, Users } from "lucide-react";

const items = [
  ["Dashboard", "/admin/dashboard", LayoutDashboard],
  ["Candidates", "/admin/candidates", Users],
  ["Exams", "/admin/exams", ListChecks],
  ["Questions", "/admin/questions", FileQuestion],
  ["Results", "/admin/results", BarChart3],
  ["Proctoring", "/admin/proctoring", ShieldAlert],
  ["Settings", "/admin/settings", Settings]
] as const;

export function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r bg-white/80 p-5 backdrop-blur md:block">
      <Link href="/admin/dashboard" className="mb-8 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-950 p-2 text-white"><GraduationCap className="h-5 w-5" /></div>
        <div>
          <p className="font-semibold">Intern Exam Portal</p>
          <p className="text-xs text-muted-foreground">Admin Console</p>
        </div>
      </Link>
      <nav className="space-y-1">
        {items.map(([label, href, Icon]) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
