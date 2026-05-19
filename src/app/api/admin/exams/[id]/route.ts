import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { examSchema } from "@/lib/validators";

function toDate(value?: string | null) { return value ? new Date(value) : null; }

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const exam = await prisma.exam.findUnique({ where: { id }, include: { questions: { include: { question: { include: { options: true } } } }, assignments: { include: { candidate: true } } } });
  return NextResponse.json(exam);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const payload = examSchema.partial().parse(await req.json());
  const data: any = { ...payload };
  if ("startTime" in data) data.startTime = toDate(payload.startTime);
  if ("endTime" in data) data.endTime = toDate(payload.endTime);
  const exam = await prisma.exam.update({ where: { id }, data });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "UPDATE_EXAM", entity: "Exam", entityId: exam.id } });
  return NextResponse.json(exam);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  await prisma.exam.delete({ where: { id } });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "DELETE_EXAM", entity: "Exam", entityId: id } });
  return NextResponse.json({ ok: true });
}
