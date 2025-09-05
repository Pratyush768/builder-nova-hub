import { X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function LiveAlertBanner({
  text,
  verified = true,
  severity = "critical" as const,
}: {
  text: string;
  verified?: boolean;
  severity?: "warning" | "critical";
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const isCrit = severity === "critical";
  return (
    <div
      className={cn(
        "sticky top-0 z-50",
        isCrit
          ? "bg-destructive text-destructive-foreground"
          : "bg-accent text-accent-foreground",
      )}
    >
      <div className="container flex items-center justify-between gap-4 py-2">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span className="rounded bg-black/10 px-2 py-0.5">
            {verified ? "VERIFIED ALERT" : "ALERT"}
          </span>
          <span>{text}</span>
        </div>
        <div className="flex items-center gap-3 text-xs opacity-90">
          <span className="hidden sm:inline">HLDMS</span>
          <button
            aria-label="Dismiss alert"
            onClick={() => setHidden(true)}
            className="rounded bg-black/10 p-1 hover:bg-black/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
