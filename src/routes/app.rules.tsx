import { createFileRoute } from "@tanstack/react-router";
import {
  FlaskConical,
  History,
  Loader2,
  PlusCircle,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useEvaluateRule,
  useRuleAudit,
  useRuleGovernance,
  useRuleGroups,
  useRuleVersion,
  useTenant,
  type RuleCondition,
  type RuleItem,
  type RuleSet,
} from "../api";
import { PageHeader } from "../components/common/PageHeader";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/rules")({ component: RulesConsole });

/* ─────────────────────────  Helpers  ───────────────────────── */

// Effect vocabulary → badge tone (from the Rules Core: fail / refer / require_info / warn /
// flag / score / pass). Deterministic hard-rule failures read as destructive.
const EFFECT_TONE: Record<string, string> = {
  fail: "bg-destructive/12 text-destructive",
  refer: "bg-amber-500/12 text-amber-500",
  require_info: "bg-amber-500/12 text-amber-500",
  warn: "bg-amber-500/12 text-amber-500",
  flag: "bg-amber-500/12 text-amber-500",
  score: "bg-primary/12 text-primary",
  pass: "bg-emerald-500/12 text-emerald-500",
};

function resolveRef(ref: string | undefined, params: Record<string, unknown>): unknown {
  if (!ref) return undefined;
  const key = ref.startsWith("params.") ? ref.slice(7) : ref;
  return params[key];
}

// Render a rule condition as a readable expression, resolving `value_ref` against the
// ruleset params (so "params.excluded_class_codes" shows the actual list).
function describeCondition(cond: RuleCondition, params: Record<string, unknown>): string {
  if (!cond) return "";
  const parts: string[] = [];
  if (cond.field) parts.push(cond.field);
  if (cond.field_b) parts.push(`vs ${cond.field_b}`);
  parts.push(cond.op);
  const val = cond.value_ref ? resolveRef(cond.value_ref, params) : cond.value;
  if (val !== undefined && val !== null) {
    parts.push(Array.isArray(val) ? `[${val.join(", ")}]` : String(val));
  }
  return parts.join(" ");
}

function fmtParam(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (v !== null && typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

/* ─────────────────────────  Page  ───────────────────────── */

function RulesConsole() {
  const { isManager } = useSession();
  const groupsQ = useRuleGroups();
  const gov = useRuleGovernance();
  const tenantQ = useTenant();
  const groups = groupsQ.data ?? [];

  // D16: how this company's rules are structured (single combined vs per-doc-type).
  const ruleMode = ((tenantQ.data?.settings?.rule_mode as string) ?? "per_doc_type") as string;

  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  const current = groups.find((g) => g.group === activeGroup) ?? groups[0];
  const version = activeVersion ?? current?.published_version ?? null;
  const versionQ = useRuleVersion(current?.group ?? null, version);
  const auditQ = useRuleAudit(current?.group);

  const isPublished = Boolean(current && version && version === current.published_version);
  const busy = gov.publish.isPending || gov.rollback.isPending;

  const switchGroup = (group: string) => {
    setActiveGroup(group);
    setActiveVersion(null); // fall back to that group's published version
  };

  const onPublish = () => {
    if (!current || !version) return;
    gov.publish.mutate(
      { group: current.group, version },
      {
        onSuccess: () =>
          toast.success(`Published ${version}. Runs stamp this rules_version for the audit trail.`),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not publish."),
      },
    );
  };

  const onRollback = () => {
    if (!current?.previous_version) return;
    if (!window.confirm(`Roll ${current.group} back to ${current.previous_version}?`)) return;
    gov.rollback.mutate(
      { group: current.group },
      {
        onSuccess: () => {
          setActiveVersion(null);
          toast.success(`Rolled back to ${current.previous_version}.`);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not roll back."),
      },
    );
  };

  const ruleset = versionQ.data;
  const params = (ruleset?.params ?? {}) as Record<string, unknown>;
  const isDraft = ruleset?.status === "draft";

  const onNewDraft = () => {
    if (!current || !version) return;
    gov.createDraft.mutate(
      { group: current.group, body: { base_version: version } },
      {
        onSuccess: (rs: RuleSet) => {
          setActiveVersion(rs.rules_version);
          toast.success(
            `Created draft ${rs.rules_version} (copied from ${version}). Edit, then publish.`,
          );
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create a draft."),
      },
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Appetite rules console"
        description="Deterministic, versioned rule groups — evaluated before the AI narrative layer. Rules are pack data; publish/rollback selects the live version per tenant."
        actions={
          <>
            <span
              className="rounded-full border border-border bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
              title="How this company's appetite rules are structured (D16). Set per tenant."
            >
              mode: {ruleMode === "single" ? "single ruleset" : "per-doc-type"}
            </span>
            <ConsoleButton tone="plain" onClick={() => setShowAudit((s) => !s)}>
              <History className="h-3.5 w-3.5" /> {showAudit ? "Hide" : "Audit"}
            </ConsoleButton>
            <ConsoleButton
              tone="plain"
              disabled={!isManager || busy || !version || gov.createDraft.isPending}
              onClick={onNewDraft}
            >
              <PlusCircle className="h-3.5 w-3.5" /> New draft
            </ConsoleButton>
            <ConsoleButton
              tone="good"
              disabled={!isManager || isPublished || busy || !version}
              onClick={onPublish}
            >
              <Upload className="h-3.5 w-3.5" />
              {isPublished ? "Published" : "Publish this version"}
            </ConsoleButton>
            <ConsoleButton
              tone="plain"
              disabled={!isManager || !current?.previous_version || busy}
              onClick={onRollback}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Rollback
            </ConsoleButton>
          </>
        }
      />

      {groupsQ.isLoading ? (
        <div className="py-10 text-center font-mono text-sm text-muted-foreground">
          Loading rule groups…
        </div>
      ) : groupsQ.isError ? (
        <div className="rounded-lg border border-destructive/35 bg-destructive/10 px-4 py-3 font-mono text-xs text-destructive">
          Couldn't load rules. Is the backend running (and the insurance pack seeded)?
        </div>
      ) : groups.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No rule groups configured for this workspace.
        </div>
      ) : (
        <>
          {/* Rule-group tabs */}
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <button
                key={g.group}
                onClick={() => switchGroup(g.group)}
                className={cn(
                  "rounded-full border px-4 py-2 font-mono text-xs transition",
                  g.group === current?.group
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {g.group}
              </button>
            ))}
          </div>

          {/* Version selector + meta */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs text-muted-foreground">Version</span>
              <select
                value={version ?? ""}
                onChange={(e) => setActiveVersion(e.target.value)}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary"
              >
                {(current?.available_versions ?? []).map((v) => (
                  <option key={v} value={v}>
                    {v}
                    {v === current?.published_version ? "  (published)" : ""}
                  </option>
                ))}
              </select>
              {isPublished ? (
                <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 font-mono text-[11px] text-emerald-500">
                  Live
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/12 px-2.5 py-1 font-mono text-[11px] text-amber-500">
                  Not published
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {current?.scope ? `scope: ${current.scope} · ` : ""}
              {current?.rule_count ?? 0} rules · published: {current?.published_version ?? "—"}
              {current?.previous_version ? ` · prev: ${current.previous_version}` : ""}
            </span>
          </div>

          {/* Rules table (read-only — rules are immutable pack data; publish a version to change) */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface text-left font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="border-b border-border px-4 py-2.5 font-medium">Rule</th>
                  <th className="border-b border-border px-4 py-2.5 font-medium">Type</th>
                  <th className="border-b border-border px-4 py-2.5 font-medium">Condition</th>
                  <th className="border-b border-border px-4 py-2.5 font-medium">Effect</th>
                </tr>
              </thead>
              <tbody>
                {versionQ.isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center font-mono text-sm text-muted-foreground"
                    >
                      Loading ruleset…
                    </td>
                  </tr>
                ) : (ruleset?.rules ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No rules in this version.
                    </td>
                  </tr>
                ) : (
                  ruleset!.rules.map((r: RuleItem) => (
                    <tr
                      key={r.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-foreground">
                          {r.description || r.id}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">{r.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {r.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {describeCondition(r.condition, params)}
                      </td>
                      <td className="px-4 py-3">
                        {r.on_match?.effect && (
                          <span
                            className={cn(
                              "inline-block rounded-full px-2.5 py-1 font-mono text-[11px]",
                              EFFECT_TONE[r.on_match.effect] ??
                                "bg-surface-2 text-muted-foreground",
                            )}
                          >
                            {r.on_match.effect}
                            {r.on_match.result ? ` → ${r.on_match.result}` : ""}
                          </span>
                        )}
                        {r.on_match?.flag && (
                          <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                            {r.on_match.flag}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Params (thresholds the rules reference via value_ref) */}
          {Object.keys(params).length > 0 && (
            <div className="rounded-xl border border-border p-4">
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                Parameters — the thresholds this version's rules reference (no number is hardcoded
                in a rule)
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {Object.entries(params).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{k}</span>
                    <span className="font-mono text-xs text-foreground">{fmtParam(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Draft editor (D11) — only for editable draft versions, admin only */}
          {isManager && isDraft && ruleset && (
            <DraftEditor
              key={`${current!.group}:${ruleset.rules_version}`}
              group={current!.group}
              version={ruleset.rules_version}
              ruleset={ruleset}
              gov={gov}
              onDeleted={() => setActiveVersion(null)}
            />
          )}

          {/* Evaluate / test tool (D12) — read-only dry-run, both roles */}
          {current && version && (
            <TestPanel
              key={`test:${current.group}:${version}`}
              group={current.group}
              version={version}
            />
          )}

          {/* Audit trail */}
          {showAudit && (
            <div className="rounded-xl border border-border p-4">
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                Rule lifecycle — publish / rollback history (this tenant + pack seed)
              </div>
              {auditQ.isLoading ? (
                <div className="py-3 font-mono text-xs text-muted-foreground">Loading audit…</div>
              ) : (auditQ.data ?? []).length === 0 ? (
                <div className="py-3 text-sm text-muted-foreground">No lifecycle events yet.</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {auditQ.data!.map((e, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-baseline justify-between gap-2 py-2"
                    >
                      <span className="font-mono text-xs">
                        <span
                          className={cn(
                            "mr-2 rounded px-1.5 py-0.5 text-[10px]",
                            e.event === "rolled_back"
                              ? "bg-amber-500/12 text-amber-500"
                              : "bg-emerald-500/12 text-emerald-500",
                          )}
                        >
                          {e.event}
                        </span>
                        <span className="text-foreground">{e.version}</span>
                        {e.previous_version ? (
                          <span className="text-muted-foreground">
                            {" "}
                            (from {e.previous_version})
                          </span>
                        ) : null}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {e.actor ?? "—"} · {fmtTime(e.timestamp)} · {e.source}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!isManager && (
            <p className="font-mono text-[11px] text-muted-foreground">
              You can view rules and versions; only owners/admins can publish or roll back.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────  Draft editor (D11)  ───────────────────────── */

function DraftEditor({
  group,
  version,
  ruleset,
  gov,
  onDeleted,
}: {
  group: string;
  version: string;
  ruleset: RuleSet;
  gov: ReturnType<typeof useRuleGovernance>;
  onDeleted: () => void;
}) {
  const [text, setText] = useState(() =>
    JSON.stringify({ params: ruleset.params ?? {}, rules: ruleset.rules ?? [] }, null, 2),
  );
  const [parseError, setParseError] = useState<string | null>(null);

  const onSave = () => {
    let parsed: { params?: Record<string, unknown>; rules?: RuleItem[] };
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }
    setParseError(null);
    gov.updateDraft.mutate(
      { group, version, body: { params: parsed.params ?? {}, rules: parsed.rules ?? [] } },
      {
        onSuccess: () => toast.success(`Saved draft ${version}.`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not save the draft."),
      },
    );
  };

  const onDelete = () => {
    if (!window.confirm(`Delete draft ${version}? This cannot be undone.`)) return;
    gov.deleteDraft.mutate(
      { group, version },
      {
        onSuccess: () => {
          toast.success(`Deleted draft ${version}.`);
          onDeleted();
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not delete the draft."),
      },
    );
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="font-mono text-[11px] uppercase tracking-wide text-primary">
          Editing draft {version} — params + rules (JSON). Publish it from the header when ready.
        </div>
        <div className="flex gap-2">
          <ConsoleButton tone="good" disabled={gov.updateDraft.isPending} onClick={onSave}>
            {gov.updateDraft.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save draft
          </ConsoleButton>
          <ConsoleButton tone="danger" disabled={gov.deleteDraft.isPending} onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </ConsoleButton>
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        rows={16}
        className="w-full resize-y rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs text-foreground outline-none focus:border-primary"
      />
      {parseError && (
        <div className="mt-2 font-mono text-[11px] text-destructive">JSON error: {parseError}</div>
      )}
    </div>
  );
}

/* ─────────────────────────  Evaluate / test tool (D12)  ───────────────────────── */

function TestPanel({ group, version }: { group: string; version: string }) {
  const evalRule = useEvaluateRule();
  const [open, setOpen] = useState(false);
  const [factsText, setFactsText] = useState(
    '{\n  "years_of_history_provided": 3,\n  "max_claim_amount": 90000\n}',
  );
  const [parseError, setParseError] = useState<string | null>(null);

  const run = () => {
    let facts: Record<string, unknown>;
    try {
      facts = JSON.parse(factsText);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }
    setParseError(null);
    evalRule.mutate({ group, version, facts });
  };

  const result = evalRule.data;

  return (
    <div className="rounded-xl border border-border p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
      >
        <FlaskConical className="h-3.5 w-3.5 text-primary" />
        Test this version — dry-run facts against {version} (read-only, no effect on live runs)
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="text-xs text-muted-foreground">
            Enter a document's extracted fields (for a per-doc group) or facts nested by document
            (for cross_document / single mode), then evaluate.
          </div>
          <textarea
            value={factsText}
            onChange={(e) => setFactsText(e.target.value)}
            spellCheck={false}
            rows={8}
            className="w-full resize-y rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs text-foreground outline-none focus:border-primary"
          />
          <div className="flex items-center gap-2">
            <ConsoleButton tone="primary" disabled={evalRule.isPending} onClick={run}>
              {evalRule.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FlaskConical className="h-3.5 w-3.5" />
              )}
              Evaluate
            </ConsoleButton>
            {parseError && (
              <span className="font-mono text-[11px] text-destructive">
                JSON error: {parseError}
              </span>
            )}
          </div>

          {evalRule.isError && (
            <div className="font-mono text-[11px] text-destructive">
              {evalRule.error instanceof Error ? evalRule.error.message : "Evaluation failed."}
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <div className="mb-2 flex items-center gap-2 font-mono text-[11px]">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5",
                    result.any_decline
                      ? "bg-destructive/12 text-destructive"
                      : "bg-emerald-500/12 text-emerald-500",
                  )}
                >
                  {result.any_decline ? "any_decline: true" : "any_decline: false"}
                </span>
                <span className="text-muted-foreground">
                  {result.hits.length} hit{result.hits.length === 1 ? "" : "s"}
                </span>
              </div>
              {result.hits.length === 0 ? (
                <div className="text-sm text-muted-foreground">No rules fired for these facts.</div>
              ) : (
                <ul className="space-y-1.5">
                  {result.hits.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-[11px] text-foreground">{h.id}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-mono text-[10px]",
                          EFFECT_TONE[h.effect ?? ""] ?? "bg-surface text-muted-foreground",
                        )}
                      >
                        {h.effect}
                        {h.result ? ` → ${h.result}` : ""}
                      </span>
                      <span className="truncate text-muted-foreground">{h.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────  Pieces  ───────────────────────── */

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
