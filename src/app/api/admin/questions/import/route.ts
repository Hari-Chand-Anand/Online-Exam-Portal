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
  let imported = 0;
  for (const row of parsed.data) {
    if (!row.question) continue;
    const type = (row.type || "MCQ").toUpperCase() as any;
    const labels = ["A", "B", "C", "D"];
    const values = [row.option_a, row.option_b, row.option_c, row.option_d];
    const correct = (row.correct_option || "").trim().toUpperCase();
    await prisma.question.create({
      data: {
        category: row.category || "General",
        difficulty: ((row.difficulty || "EASY").toUpperCase() as any),
        type,
        questionText: row.question,
        correctAnswer: row.correct_option || null,
        marks: Number(row.marks || 1),
        options: type === "MCQ" || type === "TRUE_FALSE" ? { create: labels.map((label, i) => ({ label, value: values[i] || label, isCorrect: correct === label, sortOrder: i })).filter(o => o.value) } : undefined
      }
    });
    imported++;
  }
  return NextResponse.json({ imported, errors: parsed.errors });
}
