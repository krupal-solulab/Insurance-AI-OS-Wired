import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Play, Sparkles, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  usePackRun,
  usePackRuns,
  useCopilot,
  useDecidePackRun,
  useStartPackRun,
  type PackRunView,
} from "../api";
import { PageHeader } from "../components/common/PageHeader";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/approvals")({ component: Submissions });

const WF = "submission_triage";

/* ─────────────────────────  Meta  ───────────────────────── */

const STATUS_META: Record<string, { label: string; cls: string }> = {
  running: { label: "Running", cls: "bg-sky-500/12 text-sky-500 border-sky-500/30" },
  awaiting_approval: {
    label: "Awaiting review",
    cls: "bg-amber-500/12 text-amber-500 border-amber-500/30",
  },
  completed: {
    label: "Completed",
    cls: "bg-emerald-500/12 text-emerald-500 border-emerald-500/30",
  },
  rejected: { label: "Rejected", cls: "bg-destructive/12 text-destructive border-destructive/30" },
  failed: { label: "Failed", cls: "bg-destructive/12 text-destructive border-destructive/30" },
};
const statusMeta = (s: string) =>
  STATUS_META[s] ?? { label: s, cls: "bg-surface-2 text-muted-foreground border-border" };

// Recommendation vocabulary from the triage `recommendation` step (PRD FR-26).
const REC_META: Record<string, { label: string; cls: string }> = {
  PROCEED: { label: "Proceed", cls: "bg-emerald-500/12 text-emerald-500 border-emerald-500/30" },
  REQUEST_INFO: {
    label: "Request info",
    cls: "bg-amber-500/12 text-amber-500 border-amber-500/30",
  },
  DECLINE: { label: "Decline", cls: "bg-destructive/12 text-destructive border-destructive/30" },
  NO_RECOMMENDATION: {
    label: "Manual review",
    cls: "bg-surface-2 text-muted-foreground border-border",
  },
};

/* ─────────────────────────  Step-output readers (resilient)  ───────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stepOut(run: PackRunView | undefined, id: string): any {
  return run?.steps?.find((s) => s.id === id)?.out ?? null;
}
function recommendationOf(run: PackRunView | undefined): string | null {
  return stepOut(run, "recommendation")?.recommendation ?? null;
}
function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/* ─────────────────────────  Page  ───────────────────────── */

function Submissions() {
  // D12: both jr. underwriters and admins may approve/reject at the review gate.
  const { hasRole } = useSession();
  const canReview = hasRole("owner", "admin", "underwriter");
  const [onlyPending, setOnlyPending] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const runsQ = usePackRuns({
    workflow_key: WF,
    status: onlyPending ? "awaiting_approval" : undefined,
  });
  const runs = (runsQ.data ?? []).filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.run_id.includes(search),
  );
  const activeId = selectedId ?? runs[0]?.run_id ?? null;
  const runQ = usePackRun(activeId);
  const decide = useDecidePackRun();
  const start = useStartPackRun();

  const onRunTriage = () => {
    start.mutate(
      { workflowKey: WF, packKey: "insurance" },
      {
        onSuccess: (r) => {
          setSelectedId(r.run_id);
          toast.success("Triage run started — reading the submission…");
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Could not start a triage run."),
      },
    );
  };

  const onDecide = (approve: boolean) => {
    if (!activeId) return;
    decide.mutate(
      { runId: activeId, approve },
      {
        onSuccess: () =>
          toast.success(approve ? "Recommendation approved." : "Submission rejected."),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Could not submit the decision."),
      },
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Submissions"
        description="Triaged submissions awaiting an underwriter review — recommendation, confidence, and flags, checked against your published appetite rules."
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={onlyPending}
                onChange={(e) => setOnlyPending(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border"
              />
              Awaiting review only
            </label>
            <button
              type="button"
              onClick={onRunTriage}
              disabled={start.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3.5 py-2 font-mono text-xs text-primary transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {start.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Run triage
            </button>
          </div>
        }
      />

      <div className="flex flex-col overflow-hidden rounded-2xl border border-border lg:h-[calc(100vh-210px)] lg:flex-row">
        {/* List pane */}
        <aside className="shrink-0 border-b border-border lg:w-[360px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search submissions"
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {runsQ.isLoading ? (
            <div className="p-8 text-center font-mono text-sm text-muted-foreground">
              Loading submissions…
            </div>
          ) : runsQ.isError ? (
            <div className="m-3 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 font-mono text-[11px] text-destructive">
              Couldn't load runs. Is the backend running + insurance pack seeded?
            </div>
          ) : runs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No submissions yet. Click{" "}
              <span className="font-medium text-foreground">Run triage</span> to triage the latest
              broker submission (or the built-in demo submission when no mailbox is connected).
            </div>
          ) : (
            runs.map((r) => {
              const sm = statusMeta(r.status);
              return (
                <button
                  key={r.run_id}
                  onClick={() => setSelectedId(r.run_id)}
                  className={cn(
                    "flex w-full flex-col gap-1.5 border-b border-border px-4 py-3.5 text-left transition hover:bg-surface",
                    r.run_id === activeId && "border-l-2 border-l-primary bg-surface-2",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{r.name}</span>
                    <Badge className={sm.cls}>{sm.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="truncate font-mono text-[11px] text-muted-foreground">
                      {r.run_id}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {new Date(r.updated_at).toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </aside>

        {/* Detail pane */}
        <section className="flex-1 p-5 md:p-6 lg:overflow-y-auto">
          {!activeId ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Select a submission from the list.
            </div>
          ) : runQ.isLoading ? (
            <div className="grid h-full place-items-center font-mono text-sm text-muted-foreground">
              Loading run…
            </div>
          ) : runQ.data ? (
            <Detail
              run={runQ.data}
              canDecide={canReview && runQ.data.status === "awaiting_approval"}
              deciding={decide.isPending}
              onApprove={() => onDecide(true)}
              onReject={() => onDecide(false)}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Run not found.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ─────────────────────────  Detail  ───────────────────────── */

function Detail({
  run,
  canDecide,
  deciding,
  onApprove,
  onReject,
}: {
  run: PackRunView;
  canDecide: boolean;
  deciding: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const rec = recommendationOf(run);
  const recMeta = rec ? REC_META[rec] : null;
  const extracted = (stepOut(run, "extract")?.fields ?? {}) as Record<string, unknown>;
  const recStep = stepOut(run, "recommendation") ?? {};
  const missingStep = stepOut(run, "missing_docs_check") ?? {};
  const missing: unknown[] = missingStep.missing_required ?? missingStep.missing ?? [];
  const appetite = stepOut(run, "appetite_eval")?.appetite_result;
  const citations: unknown[] = recStep.citations ?? [];
  const narrative: string = recStep.rationale ?? run.summary ?? "";
  const sm = statusMeta(run.status);

  return (
    <div className="space-y-4">
      {/* Head */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {fmt(extracted.named_insured) !== "—" ? fmt(extracted.named_insured) : run.name}
          </h2>
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{run.run_id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={sm.cls}>{sm.label}</Badge>
          {recMeta && (
            <Badge className={cn(recMeta.cls, "px-3 py-1 text-xs")}>
              {recMeta.label}
              {recStep.confidence ? ` · ${fmt(recStep.confidence)}` : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Extracted data + appetite */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card label="Extracted data">
          <Field label="Named insured" value={fmt(extracted.named_insured)} />
          <Field label="Class code" value={fmt(extracted.class_code)} />
          <Field label="Stated annual revenue" value={fmt(extracted.stated_annual_revenue)} />
          <Field label="States of operation" value={fmt(extracted.states_of_operation)} />
          <Field label="Effective date" value={fmt(extracted.effective_date)} />
        </Card>
        <Card label="Appetite & rules">
          <Field label="Appetite result" value={fmt(appetite)} />
          <Field
            label="Rules version"
            value={fmt(stepOut(run, "recommendation")?.rules_version ?? run.data?.rules_version)}
          />
          <div className="mt-2 text-xs text-muted-foreground">
            Deterministic appetite rules run before the AI narrative — a hard-rule failure
            short-circuits to Decline.
          </div>
        </Card>
      </div>

      {/* Risk narrative */}
      {narrative && (
        <Card label="Risk narrative">
          <Narrative text={narrative} />
          {citations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {citations.map((c, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary"
                >
                  {typeof c === "string"
                    ? c
                    : fmt((c as Record<string, unknown>).source_field ?? c)}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Missing info */}
      {missing.length > 0 && (
        <Card label="Missing info">
          <div className="space-y-2.5">
            {missing.map((m, i) => {
              const obj = (typeof m === "object" && m ? m : {}) as Record<string, unknown>;
              const text = typeof m === "string" ? m : fmt(obj.item ?? obj.reason ?? m);
              const sev = String(obj.severity ?? "required");
              return (
                <div key={i} className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px]",
                      sev === "recommended"
                        ? "bg-amber-500/12 text-amber-500"
                        : "bg-destructive/12 text-destructive",
                    )}
                  >
                    {sev === "recommended" ? "Recommended" : "Required"}
                  </span>
                  {text}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Execution flow */}
      <Card label="Pipeline">
        <div className="flex flex-wrap gap-1.5">
          {run.steps.map((s) => (
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
      </Card>

      {/* Submission Copilot — grounded, cited Q&A over THIS run's outputs */}
      <CopilotPanel runId={run.run_id} />

      {/* Actions */}
      {run.status === "awaiting_approval" ? (
        canDecide ? (
          <div className="flex flex-wrap gap-2.5">
            <ConsoleButton tone="good" disabled={deciding} onClick={onApprove}>
              {deciding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Approve recommendation
            </ConsoleButton>
            <ConsoleButton tone="danger" disabled={deciding} onClick={onReject}>
              <XCircle className="h-3.5 w-3.5" /> Reject
            </ConsoleButton>
            <ConsoleButton
              tone="primary"
              onClick={() =>
                toast.info("Draft request-info email opens in the copilot. Not sent automatically.")
              }
            >
              Draft request-info email
            </ConsoleButton>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Sign in as an underwriter or admin to approve or reject.
          </p>
        )
      ) : run.status === "failed" && run.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 font-mono text-xs text-destructive">
          Failed at {run.current_step ?? "a step"}: {run.error}
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────  Pieces  ───────────────────────── */

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-2 py-0.5 font-mono text-[11px]",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-0.5 text-xs text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground/90">{value}</div>
    </div>
  );
}

function Narrative({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(
      <sup key={key++} className="ml-0.5 align-super text-[10px] font-medium text-primary">
        [{m[1]}]
      </sup>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <p className="text-sm leading-relaxed text-foreground/90">{nodes}</p>;
}

const COPILOT_SUGGESTIONS = [
  "Why this recommendation?",
  "What's missing to bind?",
  "Any appetite concerns?",
  "Summarize the loss history.",
];

function CopilotPanel({ runId }: { runId: string }) {
  const [question, setQuestion] = useState("");
  const copilot = useCopilot();
  const ask = (q: string) => {
    const query = q.trim();
    if (!query || copilot.isPending) return;
    setQuestion(query);
    copilot.mutate({ runId, question: query });
  };
  const answer = copilot.data;
  const citations = (answer?.citations ?? []) as unknown[];

  return (
    <Card label="Submission Copilot">
      <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Grounded in this submission&apos;s extracted data + checks — answers are cited, never
        invented.
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {COPILOT_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            disabled={copilot.isPending}
            className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(question);
            }
          }}
          rows={2}
          placeholder="Ask about this submission…"
          className="flex-1 resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <ConsoleButton
          tone="primary"
          disabled={copilot.isPending || !question.trim()}
          onClick={() => ask(question)}
        >
          {copilot.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Ask
        </ConsoleButton>
      </div>

      {copilot.isError && (
        <div className="mt-3 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 font-mono text-[11px] text-destructive">
          {copilot.error instanceof Error ? copilot.error.message : "The copilot could not answer."}
        </div>
      )}

      {answer && (
        <div className="mt-3 rounded-lg border border-border bg-surface-2 p-3">
          <Narrative text={answer.answer} />
          {citations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {citations.map((c, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary"
                >
                  {typeof c === "string"
                    ? c
                    : fmt((c as Record<string, unknown>).source_field ?? c)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ConsoleButton({
  children,
  onClick,
  disabled,
  tone = "plain",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "plain" | "primary" | "good" | "danger";
}) {
  const toneCls =
    tone === "good"
      ? "border-emerald-500/40 text-emerald-500 hover:border-emerald-500"
      : tone === "danger"
        ? "border-destructive/40 text-destructive hover:border-destructive"
        : tone === "primary"
          ? "border-primary/40 text-primary hover:border-primary"
          : "border-border text-foreground hover:border-muted-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border bg-transparent px-3.5 py-2 font-mono text-xs transition disabled:cursor-not-allowed disabled:opacity-40",
        toneCls,
      )}
    >
      {children}
    </button>
  );
}
