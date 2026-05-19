import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { candidateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const candidates = await prisma.candidate.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { college: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" },
    include: { attempts: { include: { result: true, exam: true } } }
  });
  return NextResponse.json(candidates);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  const payload = candidateSchema.parse(await req.json());
  const candidate = await prisma.candidate.upsert({
    where: { email: payload.email },
    update: payload,
    create: payload
  });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "UPSERT_CANDIDATE", entity: "Candidate", entityId: candidate.id } });
  return NextResponse.json(candidate);
}
