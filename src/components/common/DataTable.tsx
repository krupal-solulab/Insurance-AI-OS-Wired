import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState, ErrorState, LoadingState } from "./states";

// Generic, typed enterprise table with loading/empty/error built in — so every list
// page (workflows, documents, users, audit…) looks and behaves identically.
export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "right";
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  error,
  onRetry,
  onRowClick,
  emptyIcon,
  emptyTitle = "Nothing here yet",
  emptyDescription,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (isLoading) return <LoadingState />;
  if (error)
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load."}
        onRetry={onRetry}
      />
    );
  if (!rows || rows.length === 0)
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground ${
                  c.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-border/60 last:border-0 ${
                onRowClick ? "cursor-pointer hover:bg-surface-2/50" : ""
              }`}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-3 text-foreground/90 ${
                    c.align === "right" ? "text-right" : "text-left"
                  } ${c.className ?? ""}`}
                >
                  {c.render
                    ? c.render(row)
                    : ((row as Record<string, unknown>)[c.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
