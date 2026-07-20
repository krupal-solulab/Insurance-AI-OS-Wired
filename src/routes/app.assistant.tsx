import { Link, createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  FileSearch,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  ApiError,
  api,
  useChatSessions,
  useDeleteChatSession,
  usePackRun,
  useRenameChatSession,
  type ChatSessionSummary,
  type PackRunView,
} from "../api";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/assistant")({ component: Assistant });

// Each assistant message can carry its OWN workflow run (runId), so a run card renders
// under exactly the message that started it — and survives relogin via the persisted
// content marker (see parseRun).
type Msg = { role: "user" | "assistant"; content: string; error?: boolean; runId?: string };

// Persisted so the conversation survives leaving/returning to the AI Assistant tab.
const SESSION_KEY = "aios.ins.chat.session_id";
const MESSAGES_KEY = "aios.ins.chat.messages";
const SIDEBAR_KEY = "aios.ins.chat.sidebar_collapsed";

// Hidden marker the backend appends to a persisted assistant message that started a run:
// `⟦aios:run:<run_id>⟧` on its own line. We parse the run id out and STRIP the marker from
// the displayed text so the run card survives relogin/history restore.
const RUN_MARKER = /⟦aios:run:([^⟧]+)⟧/;

function parseRun(content: string): { text: string; runId?: string } {
  const match = content.match(RUN_MARKER);
  if (!match) return { text: content };
  const text = content.replace(RUN_MARKER, "").replace(/\n{3,}/g, "\n\n").trim();
  return { text, runId: match[1].trim() };
}

function fromHistory(m: { role: "user" | "assistant"; content: string }): Msg {
  if (m.role !== "assistant") return { role: m.role, content: m.content };
  const { text, runId } = parseRun(m.content);
  return { role: "assistant", content: text, runId };
}

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/* ─────────────────────────  Conversations sidebar helpers  ───────────────────────── */

type DateGroup = "Today" | "Yesterday" | "Previous 7 days" | "Older";
const GROUP_ORDER: DateGroup[] = ["Today", "Yesterday", "Previous 7 days", "Older"];

function dateGroup(iso: string, now: Date = new Date()): DateGroup {
  const day = 86_400_000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "Older";
  if (t >= startOfToday) return "Today";
  if (t >= startOfToday - day) return "Yesterday";
  if (t >= startOfToday - 7 * day) return "Previous 7 days";
  return "Older";
}

function shortTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return d.getTime() >= startOfToday
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const SUGGESTED: { icon: LucideIcon; label: string; short: string }[] = [
  { icon: FileSearch, label: "Summarize my most recent submission.", short: "Summarize a submission" },
  { icon: Bot, label: "Run submission triage on the latest broker email.", short: "Run submission triage" },
  { icon: ShieldCheck, label: "Explain how approvals work here.", short: "How approvals work" },
  { icon: Sparkles, label: "What can this platform do for my team?", short: "Explore the platform" },
];

/* ─────────────────────────  Page  ───────────────────────── */

function Assistant() {
  // Hydrate synchronously from the local mirror so the conversation paints instantly on
  // return; the server history fetch below then reconciles it.
  const [messages, setMessages] = useState<Msg[]>(() => readStored<Msg[]>(MESSAGES_KEY, []));
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  // Files picked via the composer's + button. Attaching implies grounding the answer
  // in documents; names are sent with the message (no upload backend wired yet).
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(() =>
    typeof window !== "undefined" ? window.localStorage.getItem(SESSION_KEY) ?? undefined : undefined,
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
    readStored<boolean>(SIDEBAR_KEY, false),
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const qc = useQueryClient();
  const { data: sessions } = useChatSessions();

  // Latest session id for use inside the async stream loop (avoids stale closures).
  const sessionRef = useRef(sessionId);
  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Restore the server-side conversation on mount (reconciles the local mirror). Assistant
  // messages that started a run carry the run marker in their content — parse it so the
  // run card is re-attached and the marker is stripped from the displayed text.
  useEffect(() => {
    const sid = sessionRef.current;
    if (!sid) return;
    let cancelled = false;
    api
      .getChatHistory(sid)
      .then((h) => {
        if (!cancelled && h.messages?.length) setMessages(h.messages.map(fromHistory));
      })
      .catch(() => {
        /* keep the local mirror if history can't be fetched */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist session + messages mirror + sidebar state.
  useEffect(() => {
    if (sessionId) window.localStorage.setItem(SESSION_KEY, sessionId);
  }, [sessionId]);
  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_KEY, JSON.stringify(sidebarCollapsed));
    } catch {
      /* non-fatal */
    }
  }, [sidebarCollapsed]);
  useEffect(() => {
    try {
      window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    } catch {
      /* quota / serialization — non-fatal */
    }
  }, [messages]);

  const appendToLast = (delta: string) =>
    setMessages((m) => {
      const copy = [...m];
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = { ...last, role: "assistant", content: last.content + delta };
      return copy;
    });

  const attachRun = (rid: string) =>
    setMessages((m) => {
      const copy = [...m];
      const last = copy[copy.length - 1];
      if (last && last.role === "assistant") copy[copy.length - 1] = { ...last, runId: rid };
      return copy;
    });

  const showError = (msg: string) =>
    setMessages((m) => {
      const copy = [...m];
      copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${msg}`, error: true };
      return copy;
    });

  const send = async (text: string) => {
    const message = text.trim();
    const files = attachments;
    if ((!message && files.length === 0) || streaming) return;
    setInput("");
    setAttachments([]);
    const attachNote = files.length
      ? `${message ? "\n\n" : ""}📎 ${files.map((f) => f.name).join(", ")}`
      : "";
    const outgoing = message + attachNote;
    const withDocs = files.length > 0;
    setMessages((m) => [
      ...m,
      { role: "user", content: outgoing },
      { role: "assistant", content: "" },
    ]);
    setStreaming(true);

    let errorMsg = "";
    try {
      let got = false;
      for await (const chunk of api.chatStream({
        message: outgoing,
        session_id: sessionRef.current,
        use_rag: withDocs,
        workspace: "insurance", // this is the Insurance workspace
      })) {
        // First frame: capture + persist the server session so we CONTINUE it next turn.
        if (chunk.session_id) {
          sessionRef.current = chunk.session_id;
          setSessionId(chunk.session_id);
        }
        // The assistant started a workflow — attach the live run to THIS assistant message.
        if (chunk.workflow?.run_id) {
          got = true;
          attachRun(chunk.workflow.run_id);
        }
        if (chunk.error) {
          errorMsg = chunk.error; // backend signalled a failure (e.g. LLM unavailable)
          break;
        }
        if (chunk.delta) {
          got = true;
          appendToLast(chunk.delta);
        }
      }
      if (!got && !errorMsg) errorMsg = "The assistant didn't return a response. Please try again.";
    } catch (e) {
      errorMsg =
        e instanceof ApiError
          ? `The assistant is unavailable (${e.status}). Please try again shortly.`
          : "Couldn't reach the assistant. Check your connection and try again.";
    } finally {
      setStreaming(false);
      // A newly-created session (with its auto-title) or an updated last_activity should
      // now appear/reorder in the Conversations sidebar.
      qc.invalidateQueries({ queryKey: ["chat-sessions"] });
    }

    // Real backend failure: surface it — never silently fake an answer.
    if (errorMsg) showError(errorMsg);
  };

  const reset = () => {
    setMessages([]);
    setSessionId(undefined);
    sessionRef.current = undefined;
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(MESSAGES_KEY);
    qc.invalidateQueries({ queryKey: ["chat-sessions"] });
  };

  // Open a past conversation from the sidebar: continue that server session and replace
  // the transcript with its history (each message's run marker is re-parsed into a card).
  const loadSession = (id: string) => {
    if (streaming || id === sessionRef.current) return;
    setSessionId(id);
    sessionRef.current = id;
    window.localStorage.setItem(SESSION_KEY, id);
    api
      .getChatHistory(id)
      .then((h) => {
        const msgs = (h.messages ?? []).map(fromHistory);
        setMessages(msgs);
        try {
          window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
        } catch {
          /* quota / serialization — non-fatal */
        }
      })
      .catch(() => setMessages([]));
  };

  const showConversation = messages.length > 0;

  const composer = (
    <Composer
      input={input}
      setInput={setInput}
      onSend={() => send(input)}
      disabled={streaming}
      placeholder="Ask about submissions, appetite, approvals…"
      attachments={attachments}
      onAttach={(list) => {
        if (list) setAttachments((prev) => [...prev, ...Array.from(list)]);
      }}
      onRemove={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
      hint="Attach files with + · Enter to send · Shift+Enter for a new line"
      autoFocus={!showConversation}
    />
  );

  return (
    <div className="-m-5 flex h-[calc(100vh-4rem)] lg:-m-6 xl:-m-8">
      <ConversationsSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onNewChat={reset}
        onSelect={loadSession}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Chat column */}
      <div className="flex min-w-0 flex-1 flex-col px-5 py-4 md:px-6 md:py-5">
        {/* Header — status label left, controls right */}
        <div className="mb-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                title="Show conversations"
                aria-label="Show conversations"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-card hover:text-primary"
              >
                <PanelLeftOpen className="h-[18px] w-[18px]" />
              </button>
            )}
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              AI Assistant
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-500 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Copilot online
            </span>
            {showConversation && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition hover:border-primary/50 hover:text-primary"
              >
                <RefreshCw className="h-3.5 w-3.5" /> New chat
              </button>
            )}
          </div>
        </div>

        {showConversation ? (
          <>
            <div ref={scrollRef} className="nice-scroll flex-1 overflow-y-auto py-4">
              <div className="mx-auto flex max-w-3xl flex-col gap-5">
                {messages.map((m, i) => {
                  const parsed =
                    m.role === "assistant" ? parseRun(m.content) : { text: m.content, runId: undefined };
                  const runId = m.runId ?? parsed.runId;
                  const showBubble = m.role === "user" || parsed.text.length > 0 || streaming;
                  return (
                    <div key={i} className="flex flex-col gap-3">
                      <div className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                        <div
                          className={cn(
                            "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                            m.role === "user"
                              ? "bg-secondary text-secondary-foreground"
                              : "brand-gradient text-primary-foreground shadow-sm shadow-primary/25",
                          )}
                        >
                          {m.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                        </div>
                        {showBubble && (
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                              m.role === "user"
                                ? "rounded-tr-sm bg-primary text-primary-foreground"
                                : m.error
                                  ? "rounded-tl-sm border border-destructive/40 bg-destructive/10 text-destructive"
                                  : "rounded-tl-sm border border-border bg-card text-foreground",
                            )}
                          >
                            {parsed.text ? (
                              <RichText text={parsed.text} />
                            ) : streaming ? (
                              <TypingDots />
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* Per-message workflow run — a live card under the reply. */}
                      {m.role === "assistant" && runId && (
                        <div className="ml-11">
                          <AssistantRunCard runId={runId} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <div className="mx-auto max-w-3xl">{composer}</div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <EmptyState composer={composer} onAsk={send} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────  Conversations sidebar  ───────────────────────── */

function ConversationsSidebar({
  sessions,
  activeSessionId,
  onNewChat,
  onSelect,
  collapsed,
  onToggleCollapse,
}: {
  sessions: ChatSessionSummary[] | undefined;
  activeSessionId?: string;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const [search, setSearch] = useState("");
  const rename = useRenameChatSession();
  const del = useDeleteChatSession();

  if (collapsed) return null;

  const q = search.trim().toLowerCase();
  const filtered = (sessions ?? []).filter(
    (s) => !q || s.title.toLowerCase().includes(q) || (s.preview ?? "").toLowerCase().includes(q),
  );

  const groups = GROUP_ORDER.map((label) => ({
    label,
    items: filtered.filter((s) => dateGroup(s.last_activity ?? s.created_at) === label),
  })).filter((g) => g.items.length > 0);

  const handleRename = (s: ChatSessionSummary) => {
    const next = window.prompt("Rename conversation", s.title);
    const title = next?.trim();
    if (title && title !== s.title) rename.mutate({ id: s.id, title });
  };

  const handleDelete = (s: ChatSessionSummary) => {
    if (!window.confirm(`Delete "${s.title}"? This can't be undone.`)) return;
    del.mutate(s.id, {
      onSuccess: () => {
        if (s.id === activeSessionId) onNewChat();
      },
    });
  };

  return (
    <aside className="hidden h-full w-[280px] shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Conversations</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNewChat}
            title="New chat"
            aria-label="New chat"
            className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            title="Collapse conversations"
            aria-label="Collapse conversations"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-card hover:text-primary"
          >
            <PanelLeftClose className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="px-3 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 focus-within:border-primary/60">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="nice-scroll flex-1 overflow-y-auto px-2 pb-3">
        {groups.length === 0 ? (
          <div className="px-2 py-8 text-center text-xs text-muted-foreground">
            {q ? "No matching conversations." : "No conversations yet."}
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-2">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((s) => {
                  const isActive = s.id === activeSessionId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => onSelect(s.id)}
                      className={cn(
                        "group relative flex cursor-pointer gap-2.5 rounded-xl border px-2.5 py-2 transition",
                        isActive
                          ? "border-primary/40 bg-primary/10"
                          : "border-transparent hover:border-border hover:bg-card",
                      )}
                    >
                      <MessageSquare
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {s.title || "Untitled"}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground group-hover:opacity-0">
                            {shortTime(s.last_activity ?? s.created_at)}
                          </span>
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{s.preview}</div>
                      </div>

                      <div className="absolute right-2 top-1.5 hidden items-center gap-0.5 group-hover:flex">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRename(s);
                          }}
                          title="Rename"
                          aria-label="Rename conversation"
                          className="grid h-6 w-6 place-items-center rounded-md border border-border bg-surface text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(s);
                          }}
                          title="Delete"
                          aria-label="Delete conversation"
                          className="grid h-6 w-6 place-items-center rounded-md border border-border bg-surface text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

/* ─────────────────────────  Per-message run card (live)  ───────────────────────── */

const RUN_STATUS: Record<string, { label: string; cls: string }> = {
  running: { label: "Running", cls: "bg-sky-500/12 text-sky-500 border-sky-500/30" },
  awaiting_approval: { label: "Awaiting review", cls: "bg-amber-500/12 text-amber-500 border-amber-500/30" },
  completed: { label: "Completed", cls: "bg-emerald-500/12 text-emerald-500 border-emerald-500/30" },
  rejected: { label: "Rejected", cls: "bg-destructive/12 text-destructive border-destructive/30" },
  failed: { label: "Failed", cls: "bg-destructive/12 text-destructive border-destructive/30" },
};

function stepStatusCls(status: string): string {
  if (status === "completed") return "border-emerald-500/30 text-emerald-500";
  if (status === "awaiting_approval") return "border-amber-500/30 text-amber-500";
  if (status === "failed") return "border-destructive/30 text-destructive";
  if (status === "running") return "border-sky-500/30 text-sky-500";
  return "border-border text-muted-foreground";
}

// A compact, LIVE run card (usePackRun polls) rendered under the assistant message that
// started a triage run — links through to the full Submissions review screen.
function AssistantRunCard({ runId }: { runId: string }) {
  const { data: run } = usePackRun(runId) as { data: PackRunView | undefined };

  if (!run) {
    return (
      <div className="rounded-xl border border-border bg-surface px-3 py-2 font-mono text-[11px] text-muted-foreground">
        Loading run…
      </div>
    );
  }

  const sm = RUN_STATUS[run.status] ?? {
    label: run.status,
    cls: "bg-surface-2 text-muted-foreground border-border",
  };
  const recStep = run.steps?.find((s) => s.id === "recommendation")?.out as
    | Record<string, unknown>
    | undefined;
  const rec = recStep?.recommendation as string | undefined;

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{run.name}</span>
        <div className="flex items-center gap-1.5">
          <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px]", sm.cls)}>
            {sm.label}
          </span>
          {rec && (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
              {rec}
            </span>
          )}
        </div>
      </div>

      {run.steps && run.steps.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {run.steps.map((s) => (
            <span
              key={s.id}
              title={`${s.name} · ${s.status}`}
              className={cn("rounded-md border px-1.5 py-0.5 font-mono text-[9px]", stepStatusCls(s.status))}
            >
              {s.id}
            </span>
          ))}
        </div>
      )}

      <Link
        to="/app/approvals"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition hover:underline"
      >
        View in Submissions →
      </Link>
    </div>
  );
}

/* ─────────────────────────  Composer  ───────────────────────── */

function Composer({
  input,
  setInput,
  onSend,
  disabled,
  placeholder,
  hint,
  autoFocus,
  attachments,
  onAttach,
  onRemove,
}: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder: string;
  hint: string;
  autoFocus?: boolean;
  attachments: File[];
  onAttach: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canSend = !disabled && (input.trim().length > 0 || attachments.length > 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSend();
      }}
      className="w-full"
    >
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((f, i) => (
            <span
              key={`${f.name}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground"
            >
              <Paperclip className="h-3 w-3 shrink-0 text-primary" />
              <span className="max-w-[180px] truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove ${f.name}`}
                className="text-muted-foreground transition hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5 rounded-2xl border border-border bg-surface p-2 shadow-sm transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            onAttach(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Attach files"
          aria-label="Attach files"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-4 w-4" />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          rows={1}
          autoFocus={autoFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-xl text-primary-foreground shadow-sm shadow-primary/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 text-center text-[11px] text-muted-foreground">{hint}</div>
    </form>
  );
}

function EmptyState({ composer, onAsk }: { composer: ReactNode; onAsk: (p: string) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-2 py-4 text-center">
      <div className="brand-gradient grid h-14 w-14 place-items-center rounded-2xl text-primary-foreground shadow-lg shadow-primary/25">
        <Sparkles className="h-6 w-6" />
      </div>
      <div className="mt-4 text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
        Workspace Copilot
      </div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
        How can I help with your <span className="text-primary">insurance</span> today?
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        I reason over your organization's data and draft answers — nothing is issued or settled
        without your approval.
      </p>

      <div className="mt-7 w-full">{composer}</div>

      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {SUGGESTED.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => onAsk(s.label)}
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
            >
              <Icon className="h-4 w-4 text-primary" />
              {s.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Lightweight renderer: **bold**, "• " bullets, and preserved line breaks.
function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-1.5" />;
        const bullet = line.trimStart().startsWith("• ");
        const body = bullet ? line.trimStart().slice(2) : line;
        return (
          <div key={i} className={cn("flex gap-2", bullet && "pl-1")}>
            {bullet && <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />}
            <span className="whitespace-pre-wrap">{renderBold(body)}</span>
          </div>
        );
      })}
    </div>
  );
}

function renderBold(text: string) {
  return text.split(/(\*\*.+?\*\*|_.+?_)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      return (
        <em key={i} className="text-muted-foreground">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
    </span>
  );
}
