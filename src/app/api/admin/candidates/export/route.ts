import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { toCsv } from "@/lib/utils";

export async function GET() {
  await requireAdmin();
  const candidates = await prisma.candidate.findMany({ orderBy: { createdAt: "desc" } });
  const csv = toCsv(candidates.map((c) => ({ name: c.name, email: c.email, phone: c.phone, college: c.college, role_applied: c.roleApplied, status: c.status })));
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=candidates.csv" } });
}
