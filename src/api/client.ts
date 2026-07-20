// API client for the Industry AI OS gateway.
//
// The frontend talks to the GATEWAY ONLY (never a service or Keycloak directly).
// Base URL comes from VITE_API_URL (see .env.example), defaulting to the local
// gateway. On login we store the Keycloak access token and send it as a bearer on
// every subsequent call. One typed method per backend endpoint — no business logic
// lives here, and there are no mock endpoints: a screen with no backend simply has
// no method here and renders an empty state.

const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8000";

const TOKEN_KEY = "aios.access_token";

// --- Dummy auth -------------------------------------------------------------
// Client-side auth fallback (localStorage). Now that the gateway's real
// login/registration flow is wired (signup posts /auth/register with
// login_source: "insurance"), this is OFF — auth goes to the backend.
// Flip to `true` only to demo the UI with no backend running.
const DUMMY_AUTH = false;
const USERS_KEY = "aios.dummy_users";
const SESSION_KEY = "aios.dummy_session";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function logout(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const resp = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!resp.ok) {
    let detail = resp.statusText;
    try {
      const body = await resp.json();
      detail = body.message ?? body.error ?? detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail, resp.status);
  }
  return (resp.status === 204 ? undefined : await resp.json()) as T;
}

// ---------------------------------------------------------------- types
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface Me {
  user_id: string;
  email: string | null;
  tenant_id: string;
  tenant_slug: string | null;
  roles: string[];
}

export interface DocumentItem {
  id: string;
  filename: string;
  content_type: string | null;
  status: string;
  size_bytes: number | null;
  created_at: string;
}

export interface RetrievedChunk {
  document_id: string;
  chunk_index: number;
  content: string;
  score: number;
}

export interface WorkflowItem {
  workflow_id: string;
  type: string;
  status: string;
  document_id: string | null;
  summary?: string | null;
  decision: string | null;
  decided_by: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectorItem {
  key: string;
  name: string;
  kind: string;
  enabled: boolean;
  tool_count: number;
}

export interface AuditEvent {
  id: string;
  tenant_id: string;
  actor_id: string;
  actor_email: string | null;
  action: string;
  resource_kind: string;
  resource_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: string;
  settings?: Record<string, unknown>;
  created_at?: string;
  note?: string;
}

export interface SystemHealth {
  overall: string;
  services: Record<string, string>;
}

export interface UserItem {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  roles: string[];
}

export interface ChatReply {
  session_id: string;
  model: string;
  answer: string;
}

/** Emitted on the stream when the assistant actually STARTED a workflow. Carries the run
 *  id so the chat can render a live run card. Extra fields the backend adds are preserved. */
export interface ChatWorkflowRef {
  run_id: string;
  status: string;
  [key: string]: unknown;
}

/** One decoded SSE frame from `chatStream`. First frame carries `session_id`; a `workflow`
 *  frame signals a started run; `delta` frames stream text; `error` signals an LLM failure. */
export interface ChatStreamFrame {
  session_id?: string;
  model?: string;
  delta?: string;
  error?: string;
  workflow?: ChatWorkflowRef;
}

/** Restored server-side chat history for a session (empty if not this user's session). */
export interface ChatHistory {
  session_id: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

/** One row in the Conversations sidebar. `title` is auto-derived from the first message;
 *  `preview` is the first user message. Empty sessions are omitted; most-recent-first. */
export interface ChatSessionSummary {
  id: string;
  title: string;
  preview: string;
  created_at: string;
  last_activity: string | null;
}

// ---------------------------------------------------------------- auth
export interface SignupInput {
  name: string;
  email: string;
  company: string;
  password: string;
}

// --- Dummy auth helpers (localStorage-backed) ---
type DummyUser = SignupInput;

function readDummyUsers(): DummyUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) ?? "[]") as DummyUser[];
  } catch {
    return [];
  }
}

function writeDummyUsers(users: DummyUser[]): void {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function meFromDummy(user: DummyUser): Me {
  const slug =
    user.company
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "workspace";
  return {
    user_id: user.email,
    email: user.email,
    tenant_id: slug,
    tenant_slug: slug,
    roles: ["owner", "admin"], // full access for the demo account
  };
}

function startDummySession(user: DummyUser): Me {
  const me = meFromDummy(user);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(me));
  setToken(`dummy.${btoa(user.email)}`);
  return me;
}

function dummyLogin(email: string, password: string): Me {
  const user = readDummyUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    throw new ApiError("Invalid email or password.", 401);
  }
  return startDummySession(user);
}

function dummySignup(input: SignupInput): Me {
  const users = readDummyUsers();
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new ApiError("An account with this email already exists.", 409);
  }
  users.push(input);
  writeDummyUsers(users);
  return startDummySession(input);
}

function dummyMe(): Me {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(SESSION_KEY) : null;
  if (!raw) throw new ApiError("Not authenticated", 401);
  return JSON.parse(raw) as Me;
}

export async function login(email: string, password: string): Promise<Me> {
  if (DUMMY_AUTH) return dummyLogin(email, password);
  const token = await request<TokenResponse>("/auth/token", {
    method: "POST",
    body: JSON.stringify({ username: email, password }),
  });
  setToken(token.access_token);
  return getMe();
}

export async function signup(input: SignupInput): Promise<Me> {
  if (DUMMY_AUTH) return dummySignup(input);
  // Real gateway signup: create the user in the `insurance` industry, then the endpoint
  // logs them straight in (returns a token). `name` is split into first/last; `company` is
  // cosmetic (public signups join the shared demo tenant as a jr. `underwriter`).
  const parts = input.name.trim().split(/\s+/);
  const first_name = parts[0] || input.email.split("@")[0];
  const last_name = parts.slice(1).join(" ") || first_name;
  const token = await request<TokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      first_name,
      last_name,
      login_source: "insurance",
    }),
  });
  setToken(token.access_token);
  return getMe();
}

export function getMe(): Promise<Me> {
  if (DUMMY_AUTH) return Promise.resolve(dummyMe());
  return request<Me>("/api/identity/me");
}

// ---------------------------------------------------------------- orchestrator
export function chat(input: {
  message: string;
  session_id?: string;
  use_rag?: boolean;
  model?: string;
  workspace?: string; // active industry workspace, so the assistant is workspace-aware
}): Promise<ChatReply> {
  return request<ChatReply>("/api/orchestrator/chat", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface CopilotAnswer {
  run_id: string;
  answer: string;
  citations: unknown[];
  grounded: boolean;
  model: string;
  workflow_key?: string;
}

/** Grounded, cited Q&A about a single workflow run (the Submission Copilot). The backend
 * answers strictly from that run's real step outputs — never fabricating. */
export function askCopilot(runId: string, question: string): Promise<CopilotAnswer> {
  return request<CopilotAnswer>("/api/orchestrator/copilot", {
    method: "POST",
    body: JSON.stringify({ run_id: runId, question, workspace: "insurance" }),
  });
}

/** Streaming chat via SSE. Yields decoded frames; caller concatenates `delta`s and reacts
 *  to the first frame's `session_id` and any `workflow` frame (a started run). */
export async function* chatStream(input: {
  message: string;
  session_id?: string;
  use_rag?: boolean;
  model?: string;
  workspace?: string; // active industry workspace, so the assistant is workspace-aware
}): AsyncGenerator<ChatStreamFrame> {
  const resp = await fetch(`${API_URL}/api/orchestrator/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (!resp.ok || !resp.body) throw new ApiError("Stream failed", resp.status);
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const data = line.replace(/^data: /, "").trim();
      if (!data || data === "[DONE]") continue;
      try {
        yield JSON.parse(data);
      } catch {
        /* ignore partial frames */
      }
    }
  }
}

/** Restore a chat session's messages so the AI Assistant survives tab switches / relogin. */
export function getChatHistory(sessionId: string): Promise<ChatHistory> {
  return request<ChatHistory>(
    `/api/orchestrator/chat/history?session_id=${encodeURIComponent(sessionId)}`,
  );
}

/** This user's chat sessions for the Conversations sidebar (most-recent-first). */
export function listChatSessions(): Promise<ChatSessionSummary[]> {
  return request<ChatSessionSummary[]>("/api/orchestrator/chat/sessions");
}

/** Rename a chat session (updates its sidebar title). */
export function renameChatSession(
  id: string,
  title: string,
): Promise<{ id: string; title: string }> {
  return request<{ id: string; title: string }>(
    `/api/orchestrator/chat/sessions/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ title }) },
  );
}

/** Delete a chat session and its history. */
export function deleteChatSession(id: string): Promise<unknown> {
  return request(`/api/orchestrator/chat/sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------- knowledge
export function listDocuments(): Promise<DocumentItem[]> {
  return request<DocumentItem[]>("/api/knowledge/documents");
}

export function getDocument(id: string): Promise<DocumentItem> {
  return request<DocumentItem>(`/api/knowledge/documents/${id}`);
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const form = new FormData();
  form.append("file", file);
  const resp = await fetch(`${API_URL}/api/knowledge/documents`, {
    method: "POST",
    headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: form, // browser sets multipart boundary
  });
  if (!resp.ok) throw new ApiError("Upload failed", resp.status);
  return resp.json();
}

export function retrieve(
  query: string,
  topK = 5,
): Promise<{ query: string; results: RetrievedChunk[] }> {
  return request("/api/knowledge/retrieve", {
    method: "POST",
    body: JSON.stringify({ query, top_k: topK }),
  });
}

// ---------------------------------------------------------------- workflows
export function listWorkflows(): Promise<WorkflowItem[]> {
  return request<WorkflowItem[]>("/api/workflows/workflows");
}

export function getWorkflow(id: string): Promise<WorkflowItem> {
  return request<WorkflowItem>(`/api/workflows/workflows/${id}`);
}

export function startDocumentReview(
  documentId: string,
): Promise<{ workflow_id: string; status: string }> {
  return request("/api/workflows/workflows/document-review", {
    method: "POST",
    body: JSON.stringify({ document_id: documentId }),
  });
}

export function approveWorkflow(id: string, comment = ""): Promise<unknown> {
  return request(`/api/workflows/workflows/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

export function rejectWorkflow(id: string, comment = ""): Promise<unknown> {
  return request(`/api/workflows/workflows/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

// ---------------------------------------------------------------- connectors
export function listConnectors(): Promise<ConnectorItem[]> {
  return request<ConnectorItem[]>("/api/connectors/connectors");
}

export function configureConnector(
  key: string,
  body: { enabled: boolean; config?: Record<string, unknown> },
): Promise<unknown> {
  return request(`/api/connectors/connectors/${key}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------- audit
export function listAuditEvents(params?: { limit?: number }): Promise<AuditEvent[]> {
  const q = params?.limit ? `?limit=${params.limit}` : "";
  return request<AuditEvent[]>(`/api/audit/events${q}`);
}

// ---------------------------------------------------------------- admin
export function getTenant(): Promise<Tenant> {
  return request<Tenant>("/api/admin/tenant");
}

export function updateTenantSettings(settings: Record<string, unknown>): Promise<unknown> {
  return request("/api/admin/tenant/settings", {
    method: "PUT",
    body: JSON.stringify({ settings }),
  });
}

export function systemHealth(): Promise<SystemHealth> {
  return request<SystemHealth>("/api/admin/system/health");
}

export function listUsers(): Promise<UserItem[]> {
  return request<UserItem[]>("/api/identity/users");
}

export function assignRole(userId: string, role: string): Promise<unknown> {
  return request(`/api/identity/users/${userId}/roles`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

// ---------------------------------------------------------------- rules (Versioned Rule Engine)
/** A rule group with this tenant's effective published/previous version (generic — any pack). */
export interface RuleGroup {
  group: string;
  pack_key: string;
  scope: string | null;
  published_version: string | null;
  previous_version: string | null;
  available_versions: string[];
  effective_date: string | null;
  rule_count: number;
}
export interface RuleCondition {
  field?: string;
  field_b?: string;
  op: string;
  value?: unknown;
  value_ref?: string;
}
export interface RuleItem {
  id: string;
  type: string;
  template?: string;
  severity: string;
  description?: string;
  condition: RuleCondition;
  on_match?: { effect: string; result?: string; flag?: string };
  citation?: { source_field?: string };
}
/** An immutable ruleset version (rules + the params they reference by value_ref). */
export interface RuleSet {
  pack_key: string;
  group: string;
  rules_version: string;
  effective_date?: string;
  scope?: string;
  status?: string; // draft | published | archived
  params: Record<string, unknown>;
  rules: RuleItem[];
}
export interface RuleAuditEntry {
  source: "tenant" | "pack";
  pack_key: string;
  group: string;
  event: string;
  version: string | null;
  previous_version: string | null;
  actor: string | null;
  timestamp: string | null;
}

export function listRuleGroups(): Promise<RuleGroup[]> {
  return request<RuleGroup[]>("/api/workflows/rules/groups");
}
export function getRuleVersion(group: string, version: string): Promise<RuleSet> {
  return request<RuleSet>(
    `/api/workflows/rules/groups/${encodeURIComponent(group)}/versions/${encodeURIComponent(version)}`,
  );
}
export function publishRuleGroup(group: string, version: string): Promise<unknown> {
  return request(`/api/workflows/rules/groups/${encodeURIComponent(group)}/publish`, {
    method: "POST",
    body: JSON.stringify({ version }),
  });
}
export function rollbackRuleGroup(group: string): Promise<unknown> {
  return request(`/api/workflows/rules/groups/${encodeURIComponent(group)}/rollback`, {
    method: "POST",
  });
}
export function listRuleAudit(group?: string): Promise<RuleAuditEntry[]> {
  const q = group ? `?group=${encodeURIComponent(group)}` : "";
  return request<RuleAuditEntry[]>(`/api/workflows/rules/audit${q}`);
}

/** Body when creating/editing a draft rule version (admin only). */
export interface RuleDraftInput {
  params?: Record<string, unknown>;
  rules?: RuleItem[];
  scope?: string | null;
  base_version?: string; // create only: copy from an existing version
}
export function createRuleDraft(group: string, body: RuleDraftInput): Promise<RuleSet> {
  return request<RuleSet>(`/api/workflows/rules/groups/${encodeURIComponent(group)}/versions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function updateRuleDraft(
  group: string,
  version: string,
  body: RuleDraftInput,
): Promise<RuleSet> {
  return request<RuleSet>(
    `/api/workflows/rules/groups/${encodeURIComponent(group)}/versions/${encodeURIComponent(version)}`,
    { method: "PUT", body: JSON.stringify(body) },
  );
}
export function deleteRuleDraft(group: string, version: string): Promise<unknown> {
  return request(
    `/api/workflows/rules/groups/${encodeURIComponent(group)}/versions/${encodeURIComponent(version)}`,
    { method: "DELETE" },
  );
}

/** One rule that fired during a dry-run evaluate. */
export interface EvaluateHit {
  id: string | null;
  severity: string | null;
  effect: string | null;
  result: string | null;
  flag: string | null;
  description: string | null;
  citation?: { source_field?: string } | null;
}
export interface EvaluateResult {
  group: string;
  version: string;
  hits: EvaluateHit[];
  any_decline: boolean;
}
/** Dry-run a document's facts against a chosen published version (read-only, no side effects). */
export function evaluateRuleVersion(
  group: string,
  version: string,
  facts: Record<string, unknown>,
): Promise<EvaluateResult> {
  return request<EvaluateResult>(
    `/api/workflows/rules/groups/${encodeURIComponent(group)}/versions/${encodeURIComponent(version)}/evaluate`,
    { method: "POST", body: JSON.stringify({ facts }) },
  );
}

// ---------------------------------------------------------------- pack runs (Workflow Pack API)
/** One row in the pack-runs list (submission/renewal/etc. queues). */
export interface PackRunSummary {
  run_id: string;
  pack_key: string;
  workflow_key: string;
  name: string;
  status: string; // running | awaiting_approval | completed | rejected | failed
  current_step: string | null;
  created_at: string;
  updated_at: string;
}
export interface PackRunStep {
  id: string;
  type: string;
  name: string;
  status: string;
  connector: string | null;
  out: unknown | null;
}
/** Live view of a single pack run — poll to watch steps advance / read step outputs. */
export interface PackRunView {
  run_id: string;
  pack_key: string;
  workflow_key: string;
  name: string;
  status: string;
  current_step: string | null;
  steps: PackRunStep[];
  summary: string | null;
  error?: string | null;
  data: Record<string, unknown>;
  connectors: string[];
  metrics: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export function listPackRuns(opts?: {
  status?: string;
  workflow_key?: string;
  limit?: number;
}): Promise<PackRunSummary[]> {
  const p = new URLSearchParams();
  if (opts?.status) p.set("status", opts.status);
  if (opts?.workflow_key) p.set("workflow_key", opts.workflow_key);
  if (opts?.limit) p.set("limit", String(opts.limit));
  const q = p.toString();
  return request<PackRunSummary[]>(`/api/workflows/packs/runs${q ? `?${q}` : ""}`);
}
export function getPackRun(runId: string): Promise<PackRunView> {
  return request<PackRunView>(`/api/workflows/packs/runs/${encodeURIComponent(runId)}`);
}
export function startPackWorkflow(
  workflowKey: string,
  packKey: string,
  inputs: Record<string, unknown> = {},
): Promise<{ run_id: string; status: string }> {
  return request(`/api/workflows/packs/${encodeURIComponent(workflowKey)}/run`, {
    method: "POST",
    body: JSON.stringify({ pack_key: packKey, inputs }),
  });
}
export function approvePackRun(runId: string, comment = ""): Promise<unknown> {
  return request(`/api/workflows/packs/runs/${encodeURIComponent(runId)}/approve`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}
export function rejectPackRun(runId: string, comment = ""): Promise<unknown> {
  return request(`/api/workflows/packs/runs/${encodeURIComponent(runId)}/reject`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

export const api = {
  apiUrl: API_URL,
  getToken,
  logout,
  login,
  signup,
  getMe,
  chat,
  chatStream,
  askCopilot,
  getChatHistory,
  listChatSessions,
  renameChatSession,
  deleteChatSession,
  listDocuments,
  getDocument,
  uploadDocument,
  retrieve,
  listWorkflows,
  getWorkflow,
  startDocumentReview,
  approveWorkflow,
  rejectWorkflow,
  listConnectors,
  configureConnector,
  listAuditEvents,
  getTenant,
  updateTenantSettings,
  systemHealth,
  listUsers,
  assignRole,
  listRuleGroups,
  getRuleVersion,
  publishRuleGroup,
  rollbackRuleGroup,
  listRuleAudit,
  listPackRuns,
  getPackRun,
  startPackWorkflow,
  approvePackRun,
  rejectPackRun,
};
