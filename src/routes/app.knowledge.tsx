import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, FileText, Loader2, Search } from "lucide-react";
import { useState } from "react";

import { useDocuments, useRetrieveDocuments } from "../api";
import { ErrorState, LoadingState } from "../components/common/states";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/knowledge")({ component: Knowledge });

function Knowledge() {
  const docsQ = useDocuments();
  const retrieve = useRetrieveDocuments(8);
  const [query, setQuery] = useState("");

  const search = () => {
    const q = query.trim();
    if (q && !retrieve.isPending) retrieve.mutate(q);
  };
  const results = retrieve.data?.results ?? [];

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          Knowledge
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Knowledge search
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Full-text search across your uploaded documents. Upload files in{" "}
          <Link to="/app/documents" className="text-primary hover:underline">
            Documents
          </Link>
          .
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search your documents…"
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-24 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={search}
          disabled={retrieve.isPending || !query.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary transition hover:border-primary disabled:opacity-40"
        >
          {retrieve.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          Search
        </button>
      </div>

      {/* Results */}
      {retrieve.isError ? (
        <ErrorState
          message={retrieve.error instanceof Error ? retrieve.error.message : "Search failed."}
        />
      ) : retrieve.data ? (
        results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matches for “{retrieve.data.query}”.</p>
        ) : (
          <div className="space-y-2.5">
            <div className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {results.length} result{results.length === 1 ? "" : "s"}
            </div>
            {results.map((r, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[11px] text-muted-foreground">
                  <span className="truncate">
                    doc {r.document_id.slice(0, 8)} · chunk {r.chunk_index}
                  </span>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                    score {r.score.toFixed(3)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">{r.content}</p>
              </div>
            ))}
          </div>
        )
      ) : null}

      {/* Documents */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Documents</h2>
        {docsQ.isLoading ? (
          <LoadingState label="Loading documents…" />
        ) : docsQ.isError ? (
          <ErrorState message="Couldn't load documents." onRetry={() => docsQ.refetch()} />
        ) : (docsQ.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No documents yet. Upload some in{" "}
            <Link to="/app/documents" className="text-primary hover:underline">
              Documents
            </Link>
            .
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {(docsQ.data ?? []).map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {d.filename}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px]",
                    d.status === "processed"
                      ? "border-emerald-500/30 text-emerald-500"
                      : "border-amber-500/30 text-amber-500",
                  )}
                >
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
