import { NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";

export async function POST(req: Request) {
  await requireAdmin();
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const rows = parsed.data.filter((r) => r.email);
  let imported = 0;
  for (const row of rows) {
    await prisma.candidate.upsert({
      where: { email: row.email.trim().toLowerCase() },
      update: {
        name: row.name || row.email,
        phone: row.phone || null,
        college: row.college || null,
        roleApplied: row.role_applied || null,
        status: "ACTIVE"
      },
      create: {
        name: row.name || row.email,
        email: row.email.trim().toLowerCase(),
        phone: row.phone || null,
        college: row.college || null,
        roleApplied: row.role_applied || null,
        status: "ACTIVE"
      }
    });
    imported++;
  }
  return NextResponse.json({ imported, errors: parsed.errors });
}
