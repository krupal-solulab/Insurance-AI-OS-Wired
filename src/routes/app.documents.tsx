import { createFileRoute } from "@tanstack/react-router";
import { FileText, Search, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { useDocuments, useUploadDocument, type DocumentItem } from "../api";
import { DataTable, type Column } from "../components/common/DataTable";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";

export const Route = createFileRoute("/app/documents")({ component: Documents });

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Documents() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const documents = useDocuments();
  const upload = useUploadDocument();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = documents.data ?? [];
    return q ? all.filter((d) => d.filename.toLowerCase().includes(q)) : all;
  }, [documents.data, query]);

  const columns: Column<DocumentItem>[] = [
    {
      key: "filename",
      header: "Document",
      render: (d) => <span className="font-medium text-foreground">{d.filename}</span>,
    },
    { key: "content_type", header: "Type", render: (d) => d.content_type ?? "—" },
    { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
    { key: "size_bytes", header: "Size", align: "right", render: (d) => formatSize(d.size_bytes) },
    {
      key: "created_at",
      header: "Uploaded",
      align: "right",
      render: (d) => new Date(d.created_at).toLocaleString(),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Upload, search, and track policy, claim, and KYC document processing across your tenant."
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload.mutate(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {upload.isPending ? "Uploading…" : "Upload"}
            </button>
          </>
        }
      />

      {upload.isError && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Upload failed. Please try again.
        </div>
      )}

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents…"
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(d) => d.id}
        isLoading={documents.isLoading}
        error={documents.error}
        onRetry={() => documents.refetch()}
        emptyIcon={FileText}
        emptyTitle="No documents yet"
        emptyDescription="Upload a policy application, claim form, or KYC document to have it parsed, embedded, and made searchable."
      />
    </div>
  );
}
