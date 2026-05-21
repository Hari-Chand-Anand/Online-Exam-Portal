import { prisma } from "@/lib/prisma";
import type { Difficulty, QuestionType } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

async function updateQuestion(formData: FormData) {
  "use server";

  const questionId = String(formData.get("questionId"));
  const category = String(formData.get("category") || "").trim();
  const difficulty = String(formData.get("difficulty") || "EASY") as Difficulty;
  const type = String(formData.get("type") || "MCQ") as QuestionType;
  const questionText = String(formData.get("questionText") || "").trim();
  const marks = Number(formData.get("marks") || 1);
  const correctAnswer = String(formData.get("correctAnswer") || "").trim();
  const explanation = String(formData.get("explanation") || "").trim();

  const optionA = String(formData.get("optionA") || "").trim();
  const optionB = String(formData.get("optionB") || "").trim();
  const optionC = String(formData.get("optionC") || "").trim();
  const optionD = String(formData.get("optionD") || "").trim();

  const normalizedCorrect = correctAnswer.toUpperCase();

  await prisma.question.update({
    where: { id: questionId },
    data: {
      category,
      difficulty,
      type,
      questionText,
      marks,
      correctAnswer: correctAnswer || null,
      explanation: explanation || null,
    },
  });

  const options =
    type === "TRUE_FALSE"
      ? [
          {
            label: "A",
            value: "True",
            isCorrect: normalizedCorrect === "TRUE" || normalizedCorrect === "A",
            sortOrder: 1,
          },
          {
            label: "B",
            value: "False",
            isCorrect: normalizedCorrect === "FALSE" || normalizedCorrect === "B",
            sortOrder: 2,
          },
        ]
      : type === "MCQ"
      ? [
          {
            label: "A",
            value: optionA,
            isCorrect: normalizedCorrect === "A",
            sortOrder: 1,
          },
          {
            label: "B",
            value: optionB,
            isCorrect: normalizedCorrect === "B",
            sortOrder: 2,
          },
          {
            label: "C",
            value: optionC,
            isCorrect: normalizedCorrect === "C",
            sortOrder: 3,
          },
          {
            label: "D",
            value: optionD,
            isCorrect: normalizedCorrect === "D",
            sortOrder: 4,
          },
        ].filter((option) => option.value.length > 0)
      : [];

  if (type === "MCQ" || type === "TRUE_FALSE") {
    for (const option of options) {
      const existing = await prisma.questionOption.findFirst({
        where: {
          questionId,
          label: option.label,
        },
      });

      if (existing) {
        await prisma.questionOption.update({
          where: { id: existing.id },
          data: {
            value: option.value,
            isCorrect: option.isCorrect,
            sortOrder: option.sortOrder,
          },
        });
      } else {
        await prisma.questionOption.create({
          data: {
            questionId,
            label: option.label,
            value: option.value,
            isCorrect: option.isCorrect,
            sortOrder: option.sortOrder,
          },
        });
      }
    }
  }

  revalidatePath("/admin/questions");
  revalidatePath(`/admin/questions/${questionId}/edit`);
  redirect("/admin/questions");
}

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      options: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!question) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Question not found</h1>
      </div>
    );
  }

  const optionA = question.options.find((option) => option.label === "A");
  const optionB = question.options.find((option) => option.label === "B");
  const optionC = question.options.find((option) => option.label === "C");
  const optionD = question.options.find((option) => option.label === "D");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Edit Question
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Update question text, options, marks, answer and difficulty.
        </p>
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={updateQuestion} className="space-y-5">
          <input type="hidden" name="questionId" value={question.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>
              <Input name="category" defaultValue={question.category} required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Difficulty
              </label>
              <select
                name="difficulty"
                defaultValue={question.difficulty}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                required
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Question Type
              </label>
              <select
                name="type"
                defaultValue={question.type}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                required
              >
                <option value="MCQ">MCQ</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="CODING">Coding / Practical</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Marks
              </label>
              <Input
                name="marks"
                type="number"
                step="0.25"
                min="0"
                defaultValue={question.marks}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Question
            </label>
            <Textarea
              name="questionText"
              defaultValue={question.questionText}
              className="min-h-32"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="optionA" placeholder="Option A" defaultValue={optionA?.value || ""} />
            <Input name="optionB" placeholder="Option B" defaultValue={optionB?.value || ""} />
            <Input name="optionC" placeholder="Option C" defaultValue={optionC?.value || ""} />
            <Input name="optionD" placeholder="Option D" defaultValue={optionD?.value || ""} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Correct Answer
            </label>
            <Input
              name="correctAnswer"
              defaultValue={question.correctAnswer || ""}
              placeholder="A / B / C / D / True / False / expected answer"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Explanation
            </label>
            <Textarea
              name="explanation"
              defaultValue={question.explanation || ""}
              placeholder="Optional explanation"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" asChild>
              <a href="/admin/questions">Cancel</a>
            </Button>

            <Button className="bg-violet-600 hover:bg-violet-700">
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}