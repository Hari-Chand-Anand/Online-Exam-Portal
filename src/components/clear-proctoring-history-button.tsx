"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function ClearProctoringHistoryButton({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  return (
    <Button
      type="submit"
      variant="outline"
      disabled={disabled}
      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
      onClick={(event) => {
        const ok = confirm(
          "Clear all proctoring history permanently? This will only delete anti-cheating logs, not candidates, exams, attempts, or results."
        );

        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Clear History
    </Button>
  );
}