"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function StartExamButton({ examId }: { examId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/candidate/attempts/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examId })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to start exam");
      setLoading(false);
      return;
    }
    router.push(`/candidate/exams/${examId}/attempt`);
  }

  return (
    <div>
      <Button onClick={start} disabled={loading} size="lg">{loading ? "Starting..." : "Accept & Start Exam"}</Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
