"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { candidateSchema, examSchema } from "@/lib/validators";

function checkbox(form: FormData, key: string) { return form.get(key) === "on" || form.get(key) === "true"; }
function dateOrNull(value: FormDataEntryValue | null) { return value ? new Date(String(value)) : null; }

export async function createCandidateAction(formData: FormData) {
  const session = await requireAdmin();
  const payload = candidateSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || null,
    college: formData.get("college") || null,
    roleApplied: formData.get("roleApplied") || null,
    status: formData.get("status") || "ACTIVE"
  });
  const candidate = await prisma.candidate.upsert({ where: { email: payload.email }, update: payload, create: payload });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "UPSERT_CANDIDATE", entity: "Candidate", entityId: candidate.id } });
  revalidatePath("/admin/candidates");
}

export async function toggleCandidateAction(id: string, status: "ACTIVE" | "INACTIVE" | "BLOCKED") {
  await requireAdmin();
  await prisma.candidate.update({ where: { id }, data: { status } });
  revalidatePath("/admin/candidates");
}

export async function createExamAction(formData: FormData) {
  const session = await requireAdmin();
  const payload = examSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    durationMinutes: formData.get("durationMinutes"),
    totalMarks: formData.get("totalMarks"),
    passingMarks: formData.get("passingMarks"),
    startTime: formData.get("startTime") || null,
    endTime: formData.get("endTime") || null,
    maxAttempts: formData.get("maxAttempts") || 1,
    negativeMarkingEnabled: checkbox(formData, "negativeMarkingEnabled"),
    negativeMarks: formData.get("negativeMarks") || 0,
    randomQuestionOrderEnabled: checkbox(formData, "randomQuestionOrderEnabled"),
    shuffleOptionsEnabled: checkbox(formData, "shuffleOptionsEnabled"),
    assignToAllCandidates: checkbox(formData, "assignToAllCandidates"),
    suspiciousThreshold: formData.get("suspiciousThreshold") || 6,
    showResultToCandidate: checkbox(formData, "showResultToCandidate"),
    status: formData.get("status") || "DRAFT"
  });
  const exam = await prisma.exam.create({ data: { ...payload, startTime: dateOrNull(formData.get("startTime")), endTime: dateOrNull(formData.get("endTime")) } });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "CREATE_EXAM", entity: "Exam", entityId: exam.id } });
  redirect(`/admin/exams/${exam.id}/edit`);
}

export async function updateExamAction(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.exam.update({
    where: { id },
    data: {
      title: String(formData.get("title")),
      description: String(formData.get("description") || ""),
      durationMinutes: Number(formData.get("durationMinutes")),
      totalMarks: Number(formData.get("totalMarks")),
      passingMarks: Number(formData.get("passingMarks")),
      startTime: dateOrNull(formData.get("startTime")),
      endTime: dateOrNull(formData.get("endTime")),
      maxAttempts: Number(formData.get("maxAttempts") || 1),
      negativeMarkingEnabled: checkbox(formData, "negativeMarkingEnabled"),
      negativeMarks: Number(formData.get("negativeMarks") || 0),
      randomQuestionOrderEnabled: checkbox(formData, "randomQuestionOrderEnabled"),
      shuffleOptionsEnabled: checkbox(formData, "shuffleOptionsEnabled"),
      assignToAllCandidates: checkbox(formData, "assignToAllCandidates"),
      suspiciousThreshold: Number(formData.get("suspiciousThreshold") || 6),
      showResultToCandidate: checkbox(formData, "showResultToCandidate"),
      status: String(formData.get("status")) as any
    }
  });
  revalidatePath(`/admin/exams/${id}/edit`);
  revalidatePath("/admin/exams");
}

export async function attachQuestionAction(examId: string, formData: FormData) {
  await requireAdmin();
  const questionId = String(formData.get("questionId"));
  const count = await prisma.examQuestion.count({ where: { examId } });
  await prisma.examQuestion.upsert({
    where: { examId_questionId: { examId, questionId } },
    update: {},
    create: { examId, questionId, sortOrder: count + 1 }
  });
  revalidatePath(`/admin/exams/${examId}/edit`);
}

export async function assignCandidateAction(examId: string, formData: FormData) {
  await requireAdmin();
  const candidateId = String(formData.get("candidateId"));
  await prisma.examAssignment.upsert({ where: { examId_candidateId: { examId, candidateId } }, update: {}, create: { examId, candidateId } });
  revalidatePath(`/admin/exams/${examId}/edit`);
}

export async function createQuestionAction(formData: FormData) {
  await requireAdmin();
  const type = String(formData.get("type"));
  const correct = String(formData.get("correctOption") || "");
  const options = ["A", "B", "C", "D"].map((label) => ({ label, value: String(formData.get(`option${label}`) || ""), isCorrect: correct === label })).filter((o) => o.value);
  await prisma.question.create({
    data: {
      type: type as any,
      category: String(formData.get("category")),
      difficulty: String(formData.get("difficulty")) as any,
      questionText: String(formData.get("questionText")),
      correctAnswer: type === "SHORT_ANSWER" || type === "CODING" ? String(formData.get("correctAnswer") || "") : correct,
      marks: Number(formData.get("marks") || 1),
      options: options.length ? { create: options.map((o, i) => ({ ...o, sortOrder: i })) } : undefined
    }
  });
  revalidatePath("/admin/questions");
}

export async function manualReviewAction(answerId: string, attemptId: string, formData: FormData) {
  await requireAdmin();
  await prisma.candidateAnswer.update({ where: { id: answerId }, data: { marksAwarded: Number(formData.get("marksAwarded") || 0), reviewedByAdmin: true } });
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId }, include: { exam: true, answers: true, result: true } });
  if (attempt?.result) {
    const score = attempt.answers.reduce((sum, a) => sum + a.marksAwarded, 0);
    const pending = attempt.answers.some((a) => !a.reviewedByAdmin && a.isCorrect === null);
    await prisma.result.update({ where: { attemptId }, data: { score, percentage: attempt.exam.totalMarks ? (score / attempt.exam.totalMarks) * 100 : 0, subjectivePending: pending, status: pending ? "PENDING_REVIEW" : score >= attempt.exam.passingMarks ? "PASSED" : "FAILED" } });
  }
  revalidatePath(`/admin/results/${attemptId}`);
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  const existing = await prisma.setting.findFirst();
  const data = {
    companyName: String(formData.get("companyName") || ""),
    logoUrl: String(formData.get("logoUrl") || "") || null,
    examRules: String(formData.get("examRules") || ""),
    suspiciousActivityThreshold: Number(formData.get("suspiciousActivityThreshold") || 6),
    showResultToCandidateDefault: checkbox(formData, "showResultToCandidateDefault"),
    emailNotificationsEnabled: checkbox(formData, "emailNotificationsEnabled")
  };
  if (existing) await prisma.setting.update({ where: { id: existing.id }, data });
  else await prisma.setting.create({ data });
  revalidatePath("/admin/settings");
}
