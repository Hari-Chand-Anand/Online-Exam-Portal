"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteExamButton({ title }: { title: string }) {
  return (
    <Button
      type="submit"
      variant="outline"
      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
      onClick={(event) => {
        const ok = confirm(
          `Delete exam "${title}" permanently? This will also delete attempts, answers, results, assignments, and proctoring logs for this exam.`
        );

        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </Button>
  );
}