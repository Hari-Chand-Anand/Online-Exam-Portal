import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2, Download, Upload, Plus } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function deleteQuestion(formData: FormData) {
  "use server";

  const id = String(formData.get("id"));

  await prisma.question.delete({
    where: { id },
  });

  revalidatePath("/admin/questions");
}

function badgeClass(type: "category" | "difficulty" | "questionType" | "marks") {
  const map = {
    category: "bg-violet-50 text-violet-700 border-violet-100",
    difficulty: "bg-indigo-50 text-indigo-700 border-indigo-100",
    questionType: "bg-slate-100 text-slate-700 border-slate-200",
    marks: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return `inline-flex items-center rounded-md border px-3 py-1 text-xs font-medium ${map[type]}`;
}

export default async function QuestionsPage() {
  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      options: {
        orderBy: { label: "asc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Question Bank
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {questions.length} questions
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="gap-2">
            <a href="/sample-questions.csv" download>
              <Download className="h-4 w-4" />
              Sample CSV
            </a>
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/admin/questions/import">
              <Upload className="h-4 w-4" />
              Import CSV
            </Link>
          </Button>

          <Button asChild className="gap-2 bg-violet-600 hover:bg-violet-700">
            <Link href="/admin/questions/new">
              <Plus className="h-4 w-4" />
              Add
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              No questions found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Add questions manually or import them using CSV.
            </p>
          </Card>
        ) : (
          questions.map((question) => (
            <Card
              key={question.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={badgeClass("category")}>
                      {question.category}
                    </span>
                    <span className={badgeClass("difficulty")}>
                      {question.difficulty}
                    </span>
                    <span className={badgeClass("questionType")}>
                      {question.type}
                    </span>
                    <span className={badgeClass("marks")}>
                      {question.marks} marks
                    </span>
                  </div>

                  <h2 className="text-base font-semibold text-slate-950">
                    {question.questionText}
                  </h2>

                  {question.options.length > 0 && (
                    <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                      {question.options.map((option) => {
                        const isCorrect =
                          option.label === question.correctAnswer;

                        return (
                          <div
                            key={option.id}
                            className={
                              isCorrect
                                ? "font-semibold text-emerald-700"
                                : "text-slate-600"
                            }
                          >
                            <span className="mr-1">{option.label}.</span>
                            {option.value}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!question.options.length && question.correctAnswer && (
                    <p className="mt-3 text-sm text-emerald-700">
                      Correct Answer: {question.correctAnswer}
                    </p>
                  )}
                </div>

                <form action={deleteQuestion}>
                  <input type="hidden" name="id" value={question.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
