// Maps any backend status string to a neutral, consistent colored pill. Industry-
// neutral — it only knows generic platform states (running, approved, failed, …).
const TONE: Record<string, string> = {
  // greens
  ok: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  processed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  enabled: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  // ambers
  running: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  processing: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  awaiting_approval: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  degraded: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  // reds
  rejected: "bg-destructive/15 text-destructive",
  failed: "bg-destructive/15 text-destructive",
  down: "bg-destructive/15 text-destructive",
  error: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status?.toLowerCase();
  const tone = TONE[key] ?? "bg-muted text-muted-foreground";
  const label = status?.replace(/_/g, " ") ?? "unknown";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tone}`}
    >
      {label}
    </span>
  );
}
