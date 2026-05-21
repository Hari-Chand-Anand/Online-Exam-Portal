import { prisma } from "@/lib/prisma";
import type { ExamStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

function toDateTimeLocal(date: Date | null) {
  if (!date) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function updateExam(formData: FormData) {
  "use server";

  const examId = String(formData.get("examId"));

  await prisma.exam.update({
    where: { id: examId },
    data: {
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      durationMinutes: Number(formData.get("durationMinutes") || 30),
      totalMarks: Number(formData.get("totalMarks") || 0),
      passingMarks: Number(formData.get("passingMarks") || 0),
      maxAttempts: Number(formData.get("maxAttempts") || 1),
      startTime: formData.get("startTime")
        ? new Date(String(formData.get("startTime")))
        : null,
      endTime: formData.get("endTime")
        ? new Date(String(formData.get("endTime")))
        : null,
      negativeMarkingEnabled: formData.get("negativeMarkingEnabled") === "on",
      negativeMarks: Number(formData.get("negativeMarks") || 0),
      randomQuestionOrderEnabled:
        formData.get("randomQuestionOrderEnabled") === "on",
      shuffleOptionsEnabled: formData.get("shuffleOptionsEnabled") === "on",
      assignToAllCandidates: formData.get("assignToAllCandidates") === "on",
      showResultToCandidate: formData.get("showResultToCandidate") === "on",
      suspiciousThreshold: Number(formData.get("suspiciousThreshold") || 6),
      status: String(formData.get("status") || "DRAFT") as ExamStatus,
    },
  });

  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${examId}/edit`);
  revalidatePath("/admin/dashboard");
}

async function addQuestionToExam(formData: FormData) {
  "use server";

  const examId = String(formData.get("examId"));
  const questionId = String(formData.get("questionId"));

  if (!examId || !questionId) return;

  const existing = await prisma.examQuestion.findFirst({
    where: { examId, questionId },
  });

  if (!existing) {
    const count = await prisma.examQuestion.count({
      where: { examId },
    });

    await prisma.examQuestion.create({
      data: {
        examId,
        questionId,
        sortOrder: count + 1,
      },
    });
  }

  revalidatePath(`/admin/exams/${examId}/edit`);
  revalidatePath("/admin/exams");
  revalidatePath("/admin/dashboard");
}

async function removeQuestionFromExam(formData: FormData) {
  "use server";

  const examId = String(formData.get("examId"));
  const questionId = String(formData.get("questionId"));

  await prisma.examQuestion.deleteMany({
    where: { examId, questionId },
  });

  revalidatePath(`/admin/exams/${examId}/edit`);
  revalidatePath("/admin/exams");
  revalidatePath("/admin/dashboard");
}

async function assignCandidateToExam(formData: FormData) {
  "use server";

  const examId = String(formData.get("examId"));
  const candidateId = String(formData.get("candidateId"));

  if (!examId || !candidateId) return;

  const existing = await prisma.examAssignment.findFirst({
    where: { examId, candidateId },
  });

  if (!existing) {
    await prisma.examAssignment.create({
      data: { examId, candidateId },
    });
  }

  revalidatePath(`/admin/exams/${examId}/edit`);
  revalidatePath("/admin/exams");
  revalidatePath("/admin/dashboard");
}

export default async function EditExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { sortOrder: "asc" },
        include: {
          question: true,
        },
      },
      assignments: {
        include: {
          candidate: true,
        },
      },
    },
  });

  if (!exam) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Exam not found</h1>
      </div>
    );
  }

  const assignedQuestionIds = exam.questions.map((item) => item.questionId);

  const availableQuestions = await prisma.question.findMany({
    where: {
      id: {
        notIn: assignedQuestionIds,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeCandidates = await prisma.candidate.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Edit Exam: {exam.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Update exam settings, add questions, remove questions, and assign candidates.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_460px]">
        <div className="space-y-6">
          <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-slate-950">
              Exam Details
            </h2>

            <form action={updateExam} className="space-y-4">
              <input type="hidden" name="examId" value={exam.id} />

              <Input name="title" defaultValue={exam.title} placeholder="Exam title" />

              <Textarea
                name="description"
                defaultValue={exam.description || ""}
                placeholder="Exam description"
                className="min-h-28"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  name="durationMinutes"
                  type="number"
                  defaultValue={exam.durationMinutes}
                  placeholder="Duration minutes"
                />

                <Input
                  name="totalMarks"
                  type="number"
                  step="0.25"
                  defaultValue={exam.totalMarks}
                  placeholder="Total marks"
                />

                <Input
                  name="passingMarks"
                  type="number"
                  step="0.25"
                  defaultValue={exam.passingMarks}
                  placeholder="Passing marks"
                />

                <Input
                  name="maxAttempts"
                  type="number"
                  defaultValue={exam.maxAttempts}
                  placeholder="Max attempts"
                />

                <Input
                  name="startTime"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(exam.startTime)}
                />

                <Input
                  name="endTime"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(exam.endTime)}
                />

                <Input
                  name="negativeMarks"
                  type="number"
                  step="0.25"
                  defaultValue={exam.negativeMarks}
                  placeholder="Negative marks"
                />

                <Input
                  name="suspiciousThreshold"
                  type="number"
                  defaultValue={exam.suspiciousThreshold}
                  placeholder="Suspicious threshold"
                />

                <select
                  name="status"
                  defaultValue={exam.status}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm md:col-span-2"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="negativeMarkingEnabled"
                    defaultChecked={exam.negativeMarkingEnabled}
                    className="h-4 w-4"
                  />
                  Negative marking
                </label>

                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="randomQuestionOrderEnabled"
                    defaultChecked={exam.randomQuestionOrderEnabled}
                    className="h-4 w-4"
                  />
                  Random question order
                </label>

                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="shuffleOptionsEnabled"
                    defaultChecked={exam.shuffleOptionsEnabled}
                    className="h-4 w-4"
                  />
                  Shuffle options
                </label>

                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="assignToAllCandidates"
                    defaultChecked={exam.assignToAllCandidates}
                    className="h-4 w-4"
                  />
                  Assign to all
                </label>

                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="showResultToCandidate"
                    defaultChecked={exam.showResultToCandidate}
                    className="h-4 w-4"
                  />
                  Show result
                </label>
              </div>

              <Button className="w-full bg-slate-950 hover:bg-slate-800">
                Save Changes
              </Button>
            </form>
          </Card>

          <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-950">
                Questions Added to This Exam
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {exam.questions.length} question(s) added. For a 10-question exam, add 10 questions here.
              </p>
            </div>

            {exam.questions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                No questions added yet. Use the Add Question box on the right side.
              </div>
            ) : (
              <div className="space-y-3">
                {exam.questions.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <h3 className="font-semibold text-slate-950">
                          {index + 1}. {item.question.questionText}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                            {item.question.category}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {item.question.type}
                          </span>
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                            {item.question.difficulty}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {item.question.marks} marks
                          </span>
                        </div>
                      </div>

                      <form action={removeQuestionFromExam}>
                        <input type="hidden" name="examId" value={exam.id} />
                        <input type="hidden" name="questionId" value={item.questionId} />
                        <Button
                          variant="outline"
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          Remove
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-slate-950">
              Add Question
            </h2>

            <form action={addQuestionToExam} className="flex gap-3">
              <input type="hidden" name="examId" value={exam.id} />

              <select
                name="questionId"
                className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                required
              >
                <option value="">Select question</option>
                {availableQuestions.map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.category} - {question.questionText.slice(0, 70)}
                  </option>
                ))}
              </select>

              <Button className="bg-slate-950 hover:bg-slate-800">Add</Button>
            </form>

            <p className="mt-3 text-sm text-slate-500">
              Add questions from Question Bank into this exam.
            </p>
          </Card>

          <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-slate-950">
              Assign Candidate
            </h2>

            <form action={assignCandidateToExam} className="flex gap-3">
              <input type="hidden" name="examId" value={exam.id} />

              <select
                name="candidateId"
                className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                required
              >
                <option value="">Select candidate</option>
                {activeCandidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} - {candidate.email}
                  </option>
                ))}
              </select>

              <Button className="bg-slate-950 hover:bg-slate-800">
                Assign
              </Button>
            </form>

            <p className="mt-3 text-sm text-slate-500">
              Assigned: {exam.assignments.length}. If Assign to all is enabled, all active candidates can attempt.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}