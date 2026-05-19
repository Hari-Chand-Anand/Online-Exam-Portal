import { Inbox } from "lucide-react";

export function EmptyState({ title = "No data yet", description = "Create or import records to see them here." }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-10 text-center">
      <Inbox className="mb-3 h-8 w-8 text-muted-foreground" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
