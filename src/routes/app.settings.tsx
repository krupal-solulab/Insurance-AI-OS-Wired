import { createFileRoute } from "@tanstack/react-router";
import { Building2, Cpu, KeyRound, LogOut, UserCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { api, useTenant } from "../api";
import { EmptyState } from "../components/common/states";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function initials(text: string) {
  const parts = text.replace(/@.*/, "").split(/[.\s_-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
}

function SettingsPage() {
  const { me } = useSession();
  const tenant = useTenant();
  const identity = me?.email ?? me?.user_id ?? "user";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Settings
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Workspace settings
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your profile, tenant, and provider configuration.
        </p>
      </div>

      {/* Identity card */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="brand-gradient grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-lg font-semibold uppercase text-primary-foreground shadow-sm shadow-primary/25">
          {initials(identity)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-foreground">{identity}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(me?.roles.length ? me.roles : ["no roles"]).map((r) => (
              <span
                key={r}
                className="rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] font-medium capitalize text-primary"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => api.logout()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>

      <div className="grid gap-5">
        <Section icon={UserCircle} title="Profile" description="How you're identified in this workspace.">
          <Row label="Email" value={me?.email ?? me?.user_id ?? "—"} />
          <Row label="Roles" value={me?.roles.join(", ") || "none"} />
          <Row label="User ID" value={<span className="font-mono text-xs">{me?.user_id}</span>} />
        </Section>

        <Section icon={Building2} title="Tenant" description="The organization this workspace belongs to.">
          {tenant.isLoading ? (
            <div className="h-20 animate-pulse rounded-lg bg-muted" />
          ) : tenant.error ? (
            <p className="text-sm text-muted-foreground">Could not load tenant details.</p>
          ) : (
            <>
              <Row label="Name" value={tenant.data?.name ?? "—"} />
              <Row label="Slug" value={tenant.data?.slug ?? "—"} />
              <Row
                label="Status"
                value={
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      tenant.data?.status === "active"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {tenant.data?.status ?? "—"}
                  </span>
                }
              />
            </>
          )}
        </Section>

        <Section icon={Cpu} title="LLM Providers" description="Model and provider configuration.">
          <EmptyState
            icon={Cpu}
            title="Provider configuration not available yet"
            description="Per-tenant model + provider settings need a backend endpoint. Models are currently configured centrally via the LiteLLM gateway."
          />
        </Section>

        <Section icon={KeyRound} title="API Keys" description="Programmatic access to the platform.">
          <EmptyState
            icon={KeyRound}
            title="No API-key management yet"
            description="Programmatic API keys will appear here once the backend exposes a keys endpoint."
          />
        </Section>
      </div>
    </div>
  );
}
