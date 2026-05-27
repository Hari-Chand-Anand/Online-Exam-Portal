"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ExamQuestionDto = {
  id: string;
  type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "CODING";
  category: string;
  difficulty: string;
  questionText: string;
  marks: number;
  options: { id: string; label: string; value: string }[];
};

export type ExistingAnswerDto = {
  questionId: string;
  selectedOptionId?: string | null;
  answerText?: string | null;
  markedForReview: boolean;
};

function isAnswered(answer?: ExistingAnswerDto) {
  if (!answer) return false;

  return Boolean(
    answer.selectedOptionId ||
      (answer.answerText && answer.answerText.trim().length > 0)
  );
}

export function ExamClient({
  examId,
  attemptId,
  endTime,
  serverNow,
  questions,
  existingAnswers,
  suspiciousThreshold,
}: {
  examId: string;
  attemptId: string;
  endTime: string;
  serverNow: string;
  questions: ExamQuestionDto[];
  existingAnswers: ExistingAnswerDto[];
  suspiciousThreshold: number;
}) {
  const router = useRouter();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ExistingAnswerDto>>(() =>
    Object.fromEntries(existingAnswers.map((answer) => [answer.questionId, answer]))
  );
  const [remainingMs, setRemainingMs] = useState(
    () => new Date(endTime).getTime() - new Date(serverNow).getTime()
  );
  const [warnings, setWarnings] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submittedRef = useRef(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const question = questions[current];

  const answeredCount = useMemo(() => {
    return questions.filter((item) => isAnswered(answers[item.id])).length;
  }, [answers, questions]);

  const unansweredQuestions = useMemo(() => {
    return questions
      .map((item, index) => ({
        questionId: item.id,
        questionNo: index + 1,
        answered: isAnswered(answers[item.id]),
      }))
      .filter((item) => !item.answered);
  }, [answers, questions]);

  const allQuestionsAnswered = unansweredQuestions.length === 0;

  const saveAnswerToServer = useCallback(
    async (next: ExistingAnswerDto) => {
      setSaving(true);

      await fetch("/api/candidate/attempts/save-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, ...next }),
      });

      setSaving(false);
    },
    [attemptId]
  );

  const saveAnswer = useCallback(
    async (next: ExistingAnswerDto) => {
      setSubmitError(null);
      setAnswers((old) => ({ ...old, [next.questionId]: next }));
      await saveAnswerToServer(next);
    },
    [saveAnswerToServer]
  );

  const saveTextAnswer = useCallback(
    (next: ExistingAnswerDto) => {
      setSubmitError(null);
      setAnswers((old) => ({ ...old, [next.questionId]: next }));

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        saveAnswerToServer(next);
      }, 500);
    },
    [saveAnswerToServer]
  );

  const submit = useCallback(async () => {
    if (submittedRef.current) return;

    submittedRef.current = true;
    setSubmitError(null);

    const res = await fetch("/api/candidate/attempts/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      submittedRef.current = false;
      setSubmitError(
        data?.error ||
          `Please attempt all ${questions.length} questions before submitting.`
      );
      return;
    }

    router.replace(`/candidate/exams/${examId}/submitted`);
  }, [attemptId, examId, questions.length, router]);

  const handleManualSubmit = useCallback(async () => {
    if (!allQuestionsAnswered) {
      const missing = unansweredQuestions
        .slice(0, 10)
        .map((item) => item.questionNo)
        .join(", ");

      setSubmitError(
        `You have attempted ${answeredCount}/${questions.length} questions. Please answer all questions before submitting. Missing question(s): ${missing}`
      );

      const firstMissing = unansweredQuestions[0];

      if (firstMissing) {
        setCurrent(firstMissing.questionNo - 1);
      }

      return;
    }

    const ok = confirm(
      `You have attempted all ${questions.length} questions. Submit exam now?`
    );

    if (ok) {
      await submit();
    }
  }, [
    allQuestionsAnswered,
    unansweredQuestions,
    answeredCount,
    questions.length,
    submit,
  ]);

  const logEvent = useCallback(
    async (eventType: string, metadata: Record<string, unknown> = {}) => {
      setWarnings((old) => old + 1);

      const res = await fetch("/api/candidate/proctoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, eventType, metadata }),
      });

      const data = await res.json().catch(() => null);

      if (data?.status === "DISQUALIFIED") {
        router.replace(`/candidate/exams/${examId}/submitted`);
      }
    },
    [attemptId, examId, router]
  );

  useEffect(() => {
    const end = new Date(endTime).getTime();
    const serverStart = new Date(serverNow).getTime();
    const clientStart = Date.now();

    const timer = setInterval(() => {
      const calculatedNow = serverStart + (Date.now() - clientStart);
      const remaining = end - calculatedNow;

      setRemainingMs(remaining);

      if (remaining <= 0) {
        submit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, serverNow, submit]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        logEvent("TAB_SWITCH", { path: location.pathname });
      }
    };

    const onBlur = () => logEvent("WINDOW_BLUR");

    const onFullscreen = () => {
      if (!document.fullscreenElement) {
        logEvent("FULLSCREEN_EXIT");
      }
    };

    const prevent = (type: "COPY" | "PASTE" | "RIGHT_CLICK") => (event: Event) => {
      event.preventDefault();
      logEvent(type);
    };

    const onCopy = prevent("COPY");
    const onPaste = prevent("PASTE");
    const onContext = prevent("RIGHT_CLICK");

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      logEvent("REFRESH_NAVIGATION");
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContext);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContext);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [logEvent]);

  if (!question) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <Card className="max-w-lg bg-white p-8 text-center text-slate-950">
          <h1 className="text-xl font-semibold">No questions assigned</h1>
          <p className="mt-2 text-sm text-slate-500">
            This exam has no questions assigned. Please contact admin.
          </p>
          <Button
            className="mt-5"
            onClick={() => router.replace("/candidate/dashboard")}
          >
            Back to Dashboard
          </Button>
        </Card>
      </main>
    );
  }

  const minutes = Math.max(0, Math.floor(remainingMs / 60000));
  const seconds = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  const currentAnswer = answers[question.id] || {
    questionId: question.id,
    markedForReview: false,
    selectedOptionId: null,
    answerText: "",
  };

  const isTheoryQuestion =
    question.type === "SHORT_ANSWER" || question.type === "CODING";

  return (
    <div className="exam-secure-area min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white/60">Secure Exam Mode</p>
            <h1 className="font-semibold">
              Question {current + 1} of {questions.length}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={
                warnings >= suspiciousThreshold - 1 ? "destructive" : "warning"
              }
            >
              Warnings: {warnings}/{suspiciousThreshold}
            </Badge>

            <div className="rounded-2xl bg-white px-4 py-2 font-mono text-lg text-slate-950">
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </div>

            <Button
              variant="secondary"
              onClick={() =>
                document.documentElement.requestFullscreen().catch(() => null)
              }
            >
              Fullscreen
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1fr_280px]">
        <Card className="border-white/10 bg-white text-slate-950 shadow-2xl">
          <CardContent className="p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="secondary">{question.category}</Badge>
              <Badge variant="outline">{question.difficulty}</Badge>
              <Badge>{question.marks} marks</Badge>
              <Badge variant="outline">{question.type}</Badge>

              {saving ? (
                <span className="text-sm text-muted-foreground">Saving...</span>
              ) : (
                <span className="text-sm text-emerald-600">Auto-saved</span>
              )}
            </div>

            {submitError && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                {submitError}
              </div>
            )}

            <h2 className="whitespace-pre-wrap text-xl font-semibold leading-8">
              {question.questionText}
            </h2>

            <div className="mt-6 space-y-3">
              {(question.type === "MCQ" || question.type === "TRUE_FALSE") &&
                question.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      saveAnswer({
                        ...currentAnswer,
                        selectedOptionId: option.id,
                        answerText: null,
                      })
                    }
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition hover:bg-slate-50",
                      currentAnswer.selectedOptionId === option.id &&
                        "border-slate-950 bg-slate-100"
                    )}
                  >
                    <span className="mr-3 font-semibold">{option.label}.</span>
                    {option.value}
                  </button>
                ))}

              {isTheoryQuestion && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Write your answer below
                  </label>

                  <Textarea
                    value={currentAnswer.answerText || ""}
                    onChange={(event) =>
                      saveTextAnswer({
                        ...currentAnswer,
                        answerText: event.target.value,
                        selectedOptionId: null,
                      })
                    }
                    className="min-h-[300px] resize-y rounded-2xl border-slate-300 bg-white p-4 text-base leading-7 text-slate-950"
                    placeholder="Type your answer here..."
                  />

                  <p className="text-xs text-slate-500">
                    Your answer is auto-saved while typing.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <Button
                variant="outline"
                disabled={current === 0}
                onClick={() => setCurrent((old) => old - 1)}
              >
                Previous
              </Button>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    saveAnswer({
                      ...currentAnswer,
                      markedForReview: !currentAnswer.markedForReview,
                    })
                  }
                >
                  {currentAnswer.markedForReview
                    ? "Unmark Review"
                    : "Mark for Review"}
                </Button>

                <Button
                  disabled={current === questions.length - 1}
                  onClick={() => setCurrent((old) => old + 1)}
                >
                  Next
                </Button>

                <Button
                  variant="destructive"
                  disabled={!allQuestionsAnswered}
                  onClick={handleManualSubmit}
                  title={
                    !allQuestionsAnswered
                      ? `Answer all ${questions.length} questions before submitting`
                      : "Submit exam"
                  }
                >
                  Submit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <aside className="rounded-2xl border border-white/10 bg-white/10 p-4">
          <div className="mb-4 flex justify-between text-sm">
            <span>Answered</span>
            <span>
              {answeredCount}/{questions.length}
            </span>
          </div>

          {!allQuestionsAnswered && (
            <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3 text-xs text-amber-100">
              Submit unlocks only after all questions are attempted.
            </div>
          )}

          <div className="grid grid-cols-5 gap-2">
            {questions.map((item, index) => {
              const answer = answers[item.id];
              const answered = isAnswered(answer);

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrent(index)}
                  className={cn(
                    "h-10 rounded-xl border border-white/20 text-sm",
                    current === index && "bg-white text-slate-950",
                    answered ? "border-emerald-300" : "",
                    answer?.markedForReview ? "border-amber-300" : ""
                  )}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2 text-xs text-white/70">
            <p>- Green border: answered</p>
            <p>- Amber border: marked for review</p>
            <p>- Theory questions show a writing box.</p>
            <p>- Manual submit requires all questions attempted.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}