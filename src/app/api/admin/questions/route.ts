import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { questionSchema } from "@/lib/validators";

export async function GET() {
  await requireAdmin();
  const questions = await prisma.question.findMany({ orderBy: { createdAt: "desc" }, include: { options: true } });
  return NextResponse.json(questions);
}

export async function POST(req: Request) {
  await requireAdmin();
  const payload = questionSchema.parse(await req.json());
  const question = await prisma.question.create({
    data: {
      type: payload.type,
      category: payload.category,
      difficulty: payload.difficulty,
      questionText: payload.questionText,
      correctAnswer: payload.correctAnswer,
      marks: payload.marks,
      options: { create: payload.options.map((o, i) => ({ ...o, sortOrder: i })) }
    },
    include: { options: true }
  });
  return NextResponse.json(question);
}
