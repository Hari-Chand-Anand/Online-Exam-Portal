import { prisma } from "@/lib/prisma";
import type { Difficulty, QuestionType } from "@prisma/client";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

async function createQuestion(formData: FormData) {
  "use server";

  const category = String(formData.get("category"));
  const difficulty = String(formData.get("difficulty")) as Difficulty;
  const type = String(formData.get("type")) as QuestionType;
  const questionText = String(formData.get("questionText"));
  const marks = Number(formData.get("marks") || 1);
  const correctAnswer = String(formData.get("correctAnswer") || "").trim();

  const optionA = String(formData.get("optionA") || "").trim();
  const optionB = String(formData.get("optionB") || "").trim();
  const optionC = String(formData.get("optionC") || "").trim();
  const optionD = String(formData.get("optionD") || "").trim();

  const normalizedCorrect = correctAnswer.toUpperCase();

  const question = await prisma.question.create({
    data: {
      category,
      difficulty,
      type,
      questionText,
      marks,
      correctAnswer,
    },
  });

  if (type === "MCQ") {
    await prisma.questionOption.createMany({
      data: [
        {
          questionId: question.id,
          label: "A",
          value: optionA,
          isCorrect: normalizedCorrect === "A",
          sortOrder: 1,
        },
        {
          questionId: question.id,
          label: "B",
          value: optionB,
          isCorrect: normalizedCorrect === "B",
          sortOrder: 2,
        },
        {
          questionId: question.id,
          label: "C",
          value: optionC,
          isCorrect: normalizedCorrect === "C",
          sortOrder: 3,
        },
        {
          questionId: question.id,
          label: "D",
          value: optionD,
          isCorrect: normalizedCorrect === "D",
          sortOrder: 4,
        },
      ].filter((item) => item.value.length > 0),
    });
  }

  if (type === "TRUE_FALSE") {
    await prisma.questionOption.createMany({
      data: [
        {
          questionId: question.id,
          label: "A",
          value: "True",
          isCorrect: normalizedCorrect === "TRUE" || normalizedCorrect === "A",
          sortOrder: 1,
        },
        {
          questionId: question.id,
          label: "B",
          value: "False",
          isCorrect: normalizedCorrect === "FALSE" || normalizedCorrect === "B",
          sortOrder: 2,
        },
      ],
    });
  }

  redirect("/admin/questions");
}

export default function NewQuestionPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Add Question</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create MCQ, true/false, short answer, or practical questions.
        </p>
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={createQuestion} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <select
                name="category"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                required
              >
                <option value="Aptitude">Aptitude</option>
                <option value="Logical Reasoning">Logical Reasoning</option>
                <option value="English">English</option>
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
                <option value="Role Based">Role Based</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Difficulty</label>
              <select
                name="difficulty"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                required
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Type</label>
              <select
                name="type"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                required
              >
                <option value="MCQ">MCQ</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="CODING">Coding / Practical</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Marks</label>
              <Input name="marks" type="number" defaultValue={1} min={1} step="0.25" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Question</label>
            <Textarea
              name="questionText"
              placeholder="Enter question text"
              required
              className="min-h-28"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="optionA" placeholder="Option A" />
            <Input name="optionB" placeholder="Option B" />
            <Input name="optionC" placeholder="Option C" />
            <Input name="optionD" placeholder="Option D" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Correct Answer</label>
            <Input
              name="correctAnswer"
              placeholder="A / B / C / D / True / False / expected answer"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" asChild>
              <a href="/admin/questions">Cancel</a>
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700">
              Save Question
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
