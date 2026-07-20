import type { LucideIcon } from "lucide-react";

// A dashboard KPI tile (Dynamics/ServiceNow style): label, big value, optional hint
// and icon. Shows a subtle skeleton while loading.
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  loading?: boolean;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClass = {
    default: "text-foreground",
    warning: "text-amber-500",
    danger: "text-destructive",
    success: "text-emerald-500",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      {loading ? (
        <div className="mt-3 h-7 w-16 animate-pulse rounded bg-muted" />
      ) : (
        <div className={`mt-2 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      )}
      {hint && !loading && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
