import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { examSchema } from "@/lib/validators";

function toDate(value?: string | null) { return value ? new Date(value) : null; }

export async function GET() {
  await requireAdmin();
  const exams = await prisma.exam.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { questions: true, attempts: true, assignments: true } } } });
  return NextResponse.json(exams);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  const payload = examSchema.parse(await req.json());
  const exam = await prisma.exam.create({ data: { ...payload, startTime: toDate(payload.startTime), endTime: toDate(payload.endTime) } });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "CREATE_EXAM", entity: "Exam", entityId: exam.id } });
  return NextResponse.json(exam);
}
