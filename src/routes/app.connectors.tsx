import { createFileRoute } from "@tanstack/react-router";
import { Cable, Check, Plug, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useConnectors, useConfigureConnector, type ConnectorItem } from "../api";
import { ErrorState, LoadingState } from "../components/common/states";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/connectors")({ component: Connectors });

function Connectors() {
  const { isManager } = useSession(); // only admins may configure connectors (D14)
  const connectorsQ = useConnectors();
  const configure = useConfigureConnector();

  const onToggle = (c: ConnectorItem) => {
    configure.mutate(
      { key: c.key, enabled: !c.enabled },
      {
        onSuccess: () => toast.success(`${c.name} ${c.enabled ? "disabled" : "enabled"}.`),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Could not update the connector."),
      },
    );
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Connector Hub
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Connected systems
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Integrations your copilots read and act through. Runs in{" "}
            <span className="font-medium text-foreground">sandbox mode</span> (fixture data) until a
            provider key + connection are configured.
          </p>
        </div>
      </div>

      {/* Non-replacement callout */}
      <section className="flex items-start gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">
            Your copilots work <span className="text-primary">with</span> your existing systems.
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Connect through each system's native API. Your policy admin system stays the system of
            record — copilots read what they need and write approved entries back.
          </p>
        </div>
      </section>

      {connectorsQ.isLoading ? (
        <LoadingState label="Loading connectors…" />
      ) : connectorsQ.isError ? (
        <ErrorState
          message="Couldn't load connectors. Is the backend running?"
          onRetry={() => connectorsQ.refetch()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(connectorsQ.data ?? []).map((c) => (
            <ConnectorCard
              key={c.key}
              connector={c}
              canConfigure={isManager}
              busy={configure.isPending}
              onToggle={() => onToggle(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConnectorCard({
  connector,
  canConfigure,
  busy,
  onToggle,
}: {
  connector: ConnectorItem;
  canConfigure: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/50 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-primary">
            <Cable className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{connector.name}</div>
            <div className="text-xs text-muted-foreground">{connector.kind}</div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            connector.enabled
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : "border-border bg-surface-2 text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              connector.enabled ? "bg-emerald-500" : "bg-muted-foreground/60",
            )}
          />
          {connector.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      <div className="mt-3 font-mono text-[11px] text-muted-foreground">
        {connector.tool_count} tool{connector.tool_count === 1 ? "" : "s"} · {connector.key}
      </div>

      <div className="mt-4">
        {canConfigure ? (
          <button
            onClick={onToggle}
            disabled={busy}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40",
              connector.enabled
                ? "border-border bg-background text-foreground hover:border-destructive hover:text-destructive"
                : "border-primary/40 bg-primary/10 text-primary hover:border-primary",
            )}
          >
            {connector.enabled ? (
              "Disable"
            ) : (
              <>
                <Plug className="h-3.5 w-3.5" /> Enable
              </>
            )}
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Check className="h-3.5 w-3.5" /> Admins configure connectors
          </div>
        )}
      </div>
    </div>
  );
}
