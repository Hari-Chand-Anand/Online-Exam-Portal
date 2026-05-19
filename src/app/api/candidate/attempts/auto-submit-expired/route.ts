import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitAttempt } from "@/lib/exam-service";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expired = await prisma.examAttempt.findMany({ where: { status: "IN_PROGRESS", endTime: { lt: new Date() } }, select: { id: true } });
  for (const attempt of expired) await submitAttempt(attempt.id, "AUTO_SUBMITTED");
  return NextResponse.json({ submitted: expired.length });
}
