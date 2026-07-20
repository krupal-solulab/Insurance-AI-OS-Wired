import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Cable,
  FileCheck2,
  FileText,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

/* ─────────────────────────  Dummy data  ───────────────────────── */

type Tone = "good" | "warn" | "bad" | "neutral";
type Tile = { label: string; value: string; hint?: string; tone?: Tone };

// Submission intake — the top of the underwriting-triage funnel.
const SUBMISSIONS: Tile[] = [
  { label: "Submissions received", value: "142", hint: "today" },
  { label: "Emails processed", value: "118", hint: "broker inbox" },
  { label: "Docs needing review", value: "9", hint: "awaiting an underwriter", tone: "warn" },
];

// What the copilot read across every submission.
const DOCUMENT_MIX: Tile[] = [
  { label: "ACORD forms", value: "140" },
  { label: "Loss runs", value: "136" },
  { label: "Financial statements", value: "98" },
];

// The three recommendation types the copilot can draft — the human decides.
const OUTCOMES: Tile[] = [
  { label: "Sent to senior underwriter", value: "64", tone: "good" },
  { label: "Requested more info", value: "51", tone: "warn" },
  { label: "Declined (appetite)", value: "18", tone: "bad" },
  { label: "AI rec. accepted as-is", value: "89%", hint: "underwriter agreement" },
];

// Pipeline health.
const OPERATIONS: Tile[] = [
  { label: "Failed / error queue", value: "2", hint: "needs attention", tone: "warn" },
  { label: "Avg. processing time", value: "7.4 min", hint: "down from 30 min manual", tone: "good" },
];

const RECENT_SUBMISSIONS: {
  name: string;
  line: string;
  status: string;
  tone: Tone;
  date: string;
  icon: LucideIcon;
}[] = [
  { name: "SUB-4471 — Acme Corp", line: "Property · Broker: Marsh", status: "Sent to senior UW", tone: "good", date: "Jul 08", icon: FileCheck2 },
  { name: "SUB-4468 — Globex LLC", line: "General Liability · Broker: Aon", status: "More info requested", tone: "warn", date: "Jul 08", icon: FileText },
  { name: "SUB-4462 — Initech Inc", line: "Cyber · Broker: Gallagher", status: "Declined (appetite)", tone: "bad", date: "Jul 07", icon: AlertTriangle },
  { name: "SUB-4459 — Umbrella Co", line: "Workers' Comp · Broker: Lockton", status: "In triage", tone: "neutral", date: "Jul 07", icon: FileText },
  { name: "SUB-4455 — Soylent Ltd", line: "Commercial Auto · Broker: HUB", status: "Sent to senior UW", tone: "good", date: "Jul 06", icon: FileCheck2 },
];

const ACTIVITY: { action: string; actor: string; detail: string; time: string }[] = [
  { action: "Submission triaged", actor: "Triage Copilot", detail: "SUB-4471 · recommend proceed", time: "10:42" },
  { action: "Sent to senior underwriter", actor: "A. Reyes", detail: "SUB-4468", time: "10:15" },
  { action: "Missing loss runs flagged", actor: "Triage Copilot", detail: "SUB-4462", time: "09:58" },
  { action: "Appetite decline drafted", actor: "Appetite Rules", detail: "SUB-4455 · cannabis, CA", time: "09:30" },
  { action: "Revenue mismatch detected", actor: "Triage Copilot", detail: "SUB-4450 · ACORD vs financials", time: "09:12" },
  { action: "Submission received", actor: "Gmail", detail: "Broker: Aon", time: "08:47" },
];

const SERVICES: { name: string; status: string; tone: Tone }[] = [
  { name: "Gmail", status: "operational", tone: "good" },
  { name: "Outlook", status: "operational", tone: "good" },
  { name: "Salesforce", status: "operational", tone: "good" },
  { name: "Google Drive", status: "operational", tone: "good" },
  { name: "Slack", status: "degraded", tone: "warn" },
  { name: "DocuSign", status: "operational", tone: "good" },
];

/* ─────────────────────────  Page  ───────────────────────── */

function Dashboard() {
  const { me } = useSession();
  const name = me?.email ? me.email.split("@")[0] : "there";

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Dashboard
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Welcome back, <span className="capitalize">{name}</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your AI underwriting triage at a glance — submissions in, recommendations out.
        </p>
      </div>

      {/* Submissions today */}
      <Group label="Submissions today">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SUBMISSIONS.map((t) => (
            <StatTile key={t.label} {...t} />
          ))}
        </div>
      </Group>

      {/* Document mix */}
      <Group label="Document mix">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DOCUMENT_MIX.map((t) => (
            <StatTile key={t.label} {...t} />
          ))}
        </div>
      </Group>

      {/* Outcomes */}
      <Group label="Outcomes (all 3 recommendation types)">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {OUTCOMES.map((t) => (
            <StatTile key={t.label} {...t} />
          ))}
        </div>
      </Group>

      {/* Operational health */}
      <Group label="Operational health">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OPERATIONS.map((t) => (
            <StatTile key={t.label} {...t} />
          ))}
        </div>
      </Group>

      {/* Recent submissions + activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel icon={FileText} title="Recent submissions" hint={`${RECENT_SUBMISSIONS.length} items`}>
          <ul className="divide-y divide-border">
            {RECENT_SUBMISSIONS.map((d) => {
              const Icon = d.icon;
              return (
                <li key={d.name} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{d.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{d.line}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusPill tone={d.tone}>{d.status}</StatusPill>
                    <span className="w-12 text-right text-xs text-muted-foreground">{d.date}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel icon={Activity} title="Activity" hint="today">
          <ul className="divide-y divide-border">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">{a.action}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {a.actor} · {a.detail}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{a.time}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Connected services */}
      <Panel icon={Cable} title="Connected services" hint="live status">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SERVICES.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5"
            >
              <span className="truncate text-sm">{s.name}</span>
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  s.tone === "good" ? "bg-emerald-500" : s.tone === "warn" ? "bg-amber-500" : "bg-muted-foreground",
                )}
                title={s.status}
              />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────  Pieces  ───────────────────────── */

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">{label}</h2>
      {children}
    </section>
  );
}

function StatTile({ label, value, hint, tone }: Tile) {
  const box =
    tone === "good"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : tone === "warn"
        ? "border-amber-500/30 bg-amber-500/10"
        : tone === "bad"
          ? "border-destructive/30 bg-destructive/10"
          : "border-border bg-card";
  const labelCls =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "bad"
          ? "text-destructive"
          : "text-muted-foreground";
  const valueCls =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-500"
        : tone === "bad"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className={cn("rounded-2xl border p-4 transition hover:-translate-y-0.5", box)}>
      <div className={cn("text-xs font-medium", labelCls)}>{label}</div>
      <div className={cn("mt-1.5 text-2xl font-semibold tabular-nums md:text-3xl", valueCls)}>
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <Icon className="h-3.5 w-3.5 text-primary" />
          {title}
        </div>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const cls =
    tone === "good"
      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
      : tone === "warn"
        ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
        : tone === "bad"
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : "bg-muted border-border text-muted-foreground";
  return (
    <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium", cls)}>
      {children}
    </span>
  );
}
