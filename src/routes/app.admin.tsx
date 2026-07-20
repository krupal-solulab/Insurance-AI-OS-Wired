import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScrollText, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useAssignRole, useAuditEvents, useUsers, type AuditEvent, type UserItem } from "../api";
import { DataTable, type Column } from "../components/common/DataTable";
import { EmptyState } from "../components/common/states";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/admin")({ component: Admin });

type Tab = "users" | "audit" | "prompts";
// The backend issues exactly these two roles (D11): admin (sr. underwriter) and
// underwriter (jr.). The assign-role endpoint rejects anything else.
const ROLES = ["admin", "underwriter"];

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "users", label: "Users", icon: Users },
  { key: "audit", label: "Audit Trail", icon: ScrollText },
  { key: "prompts", label: "Prompt Management", icon: Sparkles },
];

function Admin() {
  const { isManager, isLoading } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("users");

  const users = useUsers();
  const audit = useAuditEvents("admin", 200);

  useEffect(() => {
    if (!isLoading && !isManager) navigate({ to: "/app" });
  }, [isLoading, isManager, navigate]);

  if (!isManager) return null;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Admin
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Administration
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Users, roles, and the tenant audit trail.
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryTile
          icon={Users}
          label="Users"
          value={users.data?.length ?? "—"}
          loading={users.isLoading}
        />
        <SummaryTile
          icon={ScrollText}
          label="Audit Events"
          value={audit.data?.length ?? "—"}
          loading={audit.isLoading}
        />
        <SummaryTile icon={ShieldCheck} label="Roles" value={ROLES.length} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition",
                tab === t.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
        {tab === "users" && <UsersTab query={users} />}
        {tab === "audit" && <AuditTab query={audit} />}
        {tab === "prompts" && (
          <EmptyState
            icon={Sparkles}
            title="Prompt management not available yet"
            description="Centralized prompt/version management needs a backend endpoint (planned with the Workflow Pack Framework)."
          />
        )}
      </div>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      {loading ? (
        <div className="mt-3 h-7 w-12 animate-pulse rounded bg-muted" />
      ) : (
        <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      )}
    </div>
  );
}

function UsersTab({ query }: { query: ReturnType<typeof useUsers> }) {
  const users = query;
  const assign = useAssignRole();

  const columns: Column<UserItem>[] = [
    {
      key: "email",
      header: "User",
      render: (u) => (
        <div>
          <div className="font-medium text-foreground">{u.email ?? u.id}</div>
          {(u.first_name || u.last_name) && (
            <div className="text-xs text-muted-foreground">
              {[u.first_name, u.last_name].filter(Boolean).join(" ")}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      render: (u) =>
        u.roles.length ? (
          <div className="flex flex-wrap gap-1">
            {u.roles.map((r) => (
              <span
                key={r}
                className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground"
              >
                {r}
              </span>
            ))}
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "assign",
      header: "Assign role",
      align: "right",
      render: (u) => (
        <select
          defaultValue=""
          onChange={(e) => e.target.value && assign.mutate({ id: u.id, role: e.target.value })}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="" disabled>
            Set role…
          </option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={users.data}
      rowKey={(u) => u.id}
      isLoading={users.isLoading}
      error={users.error}
      onRetry={() => users.refetch()}
      emptyTitle="No users found"
    />
  );
}

function AuditTab({ query }: { query: ReturnType<typeof useAuditEvents> }) {
  const audit = query;

  const columns: Column<AuditEvent>[] = [
    {
      key: "action",
      header: "Action",
      render: (e) => <span className="font-medium">{e.action}</span>,
    },
    { key: "actor", header: "Actor", render: (e) => e.actor_email ?? e.actor_id },
    { key: "resource", header: "Resource", render: (e) => `${e.resource_kind}` },
    {
      key: "created_at",
      header: "When",
      align: "right",
      render: (e) => new Date(e.created_at).toLocaleString(),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={audit.data}
      rowKey={(e) => e.id}
      isLoading={audit.isLoading}
      error={audit.error}
      onRetry={() => audit.refetch()}
      emptyTitle="No audit events"
      emptyDescription="Actions across the tenant will be recorded here."
    />
  );
}
