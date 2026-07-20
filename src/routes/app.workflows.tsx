import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  Workflow as WorkflowIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment, useState } from "react";

import { usePackRun, usePackRuns } from "../api";
import { ErrorState, LoadingState } from "../components/common/states";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/workflows")({ component: Workflows });

const STATUS_META: Record<string, { label: string; cls: string }> = {
  running: { label: "Running", cls: "bg-sky-500/10 border-sky-500/30 text-sky-500" },
  awaiting_approval: {
    label: "Awaiting Approval",
    cls: "bg-amber-500/10 border-amber-500/30 text-amber-500",
  },
  completed: {
    label: "Completed",
    cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
  },
  rejected: { label: "Rejected", cls: "bg-destructive/10 border-destructive/30 text-destructive" },
  failed: { label: "Failed", cls: "bg-destructive/10 border-destructive/30 text-destructive" },
};
const statusMeta = (s: string) =>
  STATUS_META[s] ?? { label: s, cls: "bg-surface-2 border-border text-muted-foreground" };

function Workflows() {
  const runsQ = usePackRuns({ limit: 100 });
  const [expanded, setExpanded] = useState<string | null>(null);
  const rows = runsQ.data ?? [];

  const count = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <WorkflowIcon className="h-3.5 w-3.5 text-primary" />
          Workflows
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Workflow runs
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Every pack workflow run across your workspace. Click one to see its steps.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={Loader2} label="Running" value={count("running")} tone="text-sky-500" />
        <Kpi
          icon={ClipboardCheck}
          label="Awaiting Approval"
          value={count("awaiting_approval")}
          tone="text-amber-500"
        />
        <Kpi
          icon={CheckCircle2}
          label="Completed"
          value={count("completed")}
          tone="text-emerald-500"
        />
        <Kpi icon={WorkflowIcon} label="Total" value={rows.length} tone="text-foreground" />
      </div>

      {runsQ.isLoading ? (
        <LoadingState label="Loading workflow runs…" />
      ) : runsQ.isError ? (
        <ErrorState
          message="Couldn't load runs. Is the backend running?"
          onRetry={() => runsQ.refetch()}
        />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No workflow runs yet. Start one from{" "}
          <span className="font-medium text-foreground">Approvals → Run triage</span>.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="w-8 px-5 py-3" />
                  <th className="px-2 py-3 font-medium">Workflow</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Current step</th>
                  <th className="px-5 py-3 text-right font-medium">Last updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const meta = statusMeta(r.status);
                  const open = expanded === r.run_id;
                  return (
                    <Fragment key={r.run_id}>
                      <tr
                        onClick={() => setExpanded((cur) => (cur === r.run_id ? null : r.run_id))}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-surface-2/50",
                          open && "bg-surface-2/40",
                        )}
                      >
                        <td className="px-5 py-3">
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              open && "rotate-90",
                            )}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <div className="font-medium text-foreground">{r.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {r.workflow_key}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              meta.cls,
                            )}
                          >
                            {r.status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{r.current_step ?? "—"}</td>
                        <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">
                          {new Date(r.updated_at).toLocaleString()}
                        </td>
                      </tr>
                      {open && (
                        <tr className="bg-surface-2/20">
                          <td colSpan={5} className="p-0">
                            <RunSteps runId={r.run_id} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RunSteps({ runId }: { runId: string }) {
  const runQ = usePackRun(runId);
  if (runQ.isLoading)
    return <div className="px-5 py-4 font-mono text-xs text-muted-foreground">Loading steps…</div>;
  const steps = runQ.data?.steps ?? [];
  return (
    <div className="flex flex-wrap gap-1.5 px-5 py-4">
      {steps.map((s) => (
        <span
          key={s.id}
          title={`${s.name} · ${s.status}`}
          className={cn(
            "rounded-md border px-2 py-1 font-mono text-[10px]",
            s.status === "completed"
              ? "border-emerald-500/30 text-emerald-500"
              : s.status === "awaiting_approval"
                ? "border-amber-500/30 text-amber-500"
                : s.status === "failed"
                  ? "border-destructive/30 text-destructive"
                  : s.status === "running"
                    ? "border-sky-500/30 text-sky-500"
                    : "border-border text-muted-foreground",
          )}
        >
          {s.name}
        </span>
      ))}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className={cn("h-4 w-4", tone)} />
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tabular-nums", tone)}>{value}</div>
    </div>
  );
}
