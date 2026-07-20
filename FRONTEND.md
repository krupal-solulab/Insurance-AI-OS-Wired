# Underwriting AI OS — Frontend (Insurance)

The **Insurance** industry frontend for the Industry AI OS platform. One of several per-industry FEs
(Accounting, Construction, Legal, …) that all talk to the **same backend**; only the industry
theming, copy, and pack differ. Accounts created here sign up into the **`insurance`** industry
(`login_source: "insurance"`). v1 target: the **MGA Underwriting Submission-Triage Copilot**
(Commercial Property) — see the root `PRD_MGA_Underwriting_Triage_Copilot (1).md`,
`Coverline_MGA_10_Workflow_Roadmap.md`, and the backend design `ai-backend/docs/INSURANCE_VERTICAL.md`.

> Sibling FEs follow this exact structure — swap the industry name, the `login_source` value, and the
> "wired vs dummy" list. **Backend contract of record:** the insurance pack's own API map,
> `ai-backend/packs/insurance/interfaces/api_design.md` (insurance = the generic pack/workflow API
> with insurance keys + a few additive, industry-neutral endpoints).

## Current status (core insurance path is wired to the real backend)
- **`DUMMY_AUTH = false`** in `src/api/client.ts` — login and signup hit the gateway. Signup posts
  `POST /auth/register` with `login_source: "insurance"` (name split into first/last).
- The **insurance backend pack exists and validates** (`ai-backend/packs/insurance/`: 5 workflows
  incl. `submission_triage.json` v2.2.0, versioned appetite rules, schemas, prompts).
- **Wired to the real Workflow-Pack API (`/api/workflows/packs/*` + `/rules/*`) + orchestrator:**
  - **Submissions / underwriter review** (`app.approvals`) — lists `submission_triage` runs, reads the
    triage step outputs, approve/reject at the review gate, and a **"Run triage"** button that starts a
    run (`POST /packs/submission_triage/run`). A run appears in the queue end-to-end.
  - **Appetite Rules console** (`app.rules`) — reads `/api/workflows/rules/*` (rule groups, versions,
    audit), publish/rollback owner/admin-gated. The old `src/lib/rules.ts` seed is **deleted**.
  - **Submission Copilot** — a grounded Q&A panel on the submission detail asks
    `POST /api/orchestrator/copilot` about the selected run; the backend answers **strictly from that
    run's real step outputs**, with citations (never fabricated).
  - **AI Assistant** (`app.assistant`) — full chat with a **Conversations sidebar** backed by the real
    `/api/orchestrator/chat/sessions` (date groups, search, new/rename/delete), server **history
    restore**, streaming replies, and a **live run card** under any message that starts a workflow. Real
    backend/LLM failures surface as an honest error — no fabricated fallback answer.
- **Still prototype / pending:** Dashboard, Document Intelligence, Workflows, Knowledge, Connectors,
  Analytics (see the scorecard below); Approvals V2 (reason codes / override / history); the
  landing/workspace copy in `src/lib/industries.ts` (still generic "Claims Processing" text).

## Tab integration scorecard (wired to real backend, out of 100)
Snapshot of how much each sidebar tab consumes the live gateway vs. static/prototype content.

| Tab | Score | State |
|---|---|---|
| Approvals (`app.approvals`) | **95** | Real runs, step outputs, start/approve/reject, grounded copilot. Only "Draft request-info email" is a stub. |
| Rules console (`app.rules`) | **95** | Real versioned groups/params/audit + publish/rollback. Read-only by design (rules are immutable pack data). |
| AI Assistant (`app.assistant`) | **85** | Real streaming chat + sessions + history + run cards. To 100: real document-attachment RAG + backend citations. |
| Settings (`app.settings`) | **55** | Real profile/tenant read + sign-out. LLM-provider/API-key panels are placeholders; no settings-write yet. |
| Dashboard (`app.index`) | **5** | All tiles/feeds hardcoded. Needs summary endpoints (none yet) + `usePackRuns`/`useAuditEvents`/`useSystemHealth`. |
| Document Intelligence (`app.document-intelligence`) | **0** | Fully static. Fix: point the nav at the already-wired `app.documents.tsx` + add extraction endpoints. |
| Workflows (`app.workflows`) | **0** | Static rows + SVG graph. Wiring gap only — `useWorkflows`/`usePackRuns` already exist in `api/`. |
| Knowledge (`app.knowledge`) | **0** | Static articles. `retrieve()`/`listDocuments()` client fns exist but unused here. |
| Connectors (`app.connectors`) | **0** | Static catalog + local state. `listConnectors()`/`configureConnector()` exist but unused. |
| Analytics (`app.analytics`) | **0** | Hardcoded KPIs/trends. Needs metrics endpoints (none yet) + wire `listAuditEvents`. |

Routes present but **not in the sidebar nav**: **Admin** (`app.admin`, ~85 — users + audit + role-assign wired) and **Documents** (`app.documents`, ~85 — real list + multipart upload). The genuinely wired experiences are **Approvals, Rules, AI Assistant, Admin, Documents** (+ partial Settings). The four marketing-style tabs (Dashboard, Document Intelligence, Knowledge, Analytics) and Workflows/Connectors are prototype/static — mostly a **FE wiring gap**, since the client + backend already exist for several of them.

## Stack
- **TanStack Start** (React 19 + TanStack Router, file-based routes) + **Vite**
- **TypeScript**, **Tailwind CSS v4** + shadcn/radix UI, **lucide-react** icons, **recharts**
- **TanStack Query** for all server state
- Talks to the **gateway only** — never a service or Keycloak directly

## Structure
```
src/
  routes/            file-based routes (TanStack Router)
    index.tsx        marketing landing + auth modal (Log in / Sign up)
    demo.tsx         product demo page
    app.tsx          authenticated shell (sidebar + header), guards on token
    app.index.tsx    dashboard
    app.assistant.tsx        AI Assistant — chat + Conversations sidebar (real sessions/history) + run cards
    app.document-intelligence.tsx   document classify/extract view (prototype)
    app.documents.tsx        document list/upload
    app.workflows.tsx        workflow runs
    app.approvals.tsx        Submissions / underwriter review — live submission_triage runs + "Run triage"
    app.rules.tsx            Appetite Rules console (versioned; reads /api/workflows/rules/*)
    app.connectors.tsx       Connector Hub
    app.analytics.tsx / app.knowledge.tsx / app.admin.tsx / app.settings.tsx
  api/
    client.ts        typed gateway client — ONE fn per endpoint; `DUMMY_AUTH` flag here
    index.ts         public API surface — import hooks/types from here
    query/*.ts       read hooks (useDocuments, useConnectors, useWorkflows, useAuditEvents, …)
    mutation/*.ts    write hooks (useUploadDocument, useDecideWorkflow, useAssignRole, …)
  components/
    layout/          AppSidebar, AppHeader, nav.ts
    common/          DataTable, StatCard, StatusBadge, IntegrationLogo, states.tsx
    ui/              shadcn primitives
  lib/               session, theme, industries (landing content), utils
```

## Backend contract (the important part)
- **Base URL:** `VITE_API_URL` (`.env` / `.env.example`; default `http://localhost:8000`, the
  gateway). The FE calls the **gateway only**.
- **Auth** (flip `DUMMY_AUTH = false` to use):
  - Login → `POST /auth/token` `{ username, password }` → stores the Keycloak access token; sent as
    `Authorization: Bearer` on every call.
  - Signup → **needs wiring**: `POST /auth/register` with **`login_source: "insurance"`** (the client
    currently throws 501 in real mode — mirror the Accounting FE's register call). Public signups
    join the shared `demo` tenant as `member`.
- **Workspace** (optional, backend-driven): `GET /industries` (pre-login) and
  `GET /api/identity/workspace/config` expose the insurance nav/theme/terminology/copilots from
  `packs/insurance/pack.json`.
- **AI Assistant** (`app.assistant`): streams `POST /api/orchestrator/chat/stream` with
  `workspace: "insurance"`; the **Conversations sidebar** uses `GET /chat/sessions`, `GET
  /chat/history`, `PATCH`/`DELETE /chat/sessions/{id}`. A message that starts a workflow gets a live
  run card via `usePackRun`. The grounded per-submission copilot uses `POST /api/orchestrator/copilot`.

## Pages: target wiring (insurance = generic pack API + a few additive endpoints)
Per `packs/insurance/interfaces/api_design.md`. ♻️ already exists · ➕ additive, industry-neutral.

| Page | Target endpoint(s) | State |
|---|---|---|
| **Submissions / underwriter review** (`app.approvals`) | ♻️ `GET /api/workflows/packs/runs?workflow_key=submission_triage&status=` · start ♻️ `POST /api/workflows/packs/submission_triage/run` · run view ♻️ `GET /api/workflows/packs/runs/{id}` · `POST /packs/runs/{id}/approve\|reject` | **wired** — queue + run view + "Run triage" + approve/reject (reason_code/override/history still additive/pending) |
| **Appetite Rules console** (`app.rules`) | ➕ `GET /api/workflows/rules/groups` · `…/versions/{v}` · 🔒 `POST …/publish` · `…/rollback` · `GET /api/workflows/rules/audit` | **wired** — real registry; publish/rollback owner/admin-gated |
| Document Intelligence (`app.document-intelligence`) | run output `document_envelope` from `GET /packs/runs/{id}` (DP core = `document.parse`+`ai.action`+`branch`+`transform`) | pipeline is a workflow, not a standalone API; FE prototype today |
| Documents (`app.documents`) | ♻️ `GET/POST /api/knowledge/documents`, `POST /api/knowledge/retrieve` | ready; FE hooks present |
| **AI Assistant** (`app.assistant`) | ♻️ `chat/stream` + `chat/sessions` (list/rename/delete) + `chat/history` | **wired** — chat + Conversations sidebar (real sessions/history) + live run cards |
| **Submission Copilot** (submission-detail panel) | ➕ `POST /api/orchestrator/copilot` (grounded, cited, per-run) | **wired** — the per-submission grounded copilot panel is live on the submission detail |
| Connectors (`app.connectors`) | ♻️ `GET /api/connectors[?all=true]`, `POST /{key}/connect-session`, `/{key}/invoke`, entitlements | ready |
| Admin / Analytics / Audit | ♻️ `/api/admin/*`, `/api/audit/events?run_id=` | ready |

**Insurance data now comes from the backend, not a FE seed:**
- The former `src/lib/rules.ts` appetite-rules seed is **deleted**. `app.rules.tsx` reads the real
  versioned registry (`GET /api/workflows/rules/*`, backed by `packs/insurance/rules/*` on disk +
  per-tenant published-version governance), and `app.approvals.tsx` reads live `submission_triage`
  run outputs — so the version an underwriter triages against is exactly what admin published.

## Run
Backend on `:8000` (gateway); a **funded LLM key** in the backend `.env` for extraction/narrative.
```bash
cp .env.example .env          # Windows: copy .env.example .env
npm install
npm run dev                   # http://localhost:8080
```
Auth + the Submissions/Rules screens hit the live backend (`DUMMY_AUTH = false`). Bring the backend up
with the insurance pack seeded, then in **Submissions** click **Run triage** — the `submission_triage`
connector step runs SANDBOX (a deterministic Lakeside Retail Plaza Commercial Property submission)
until a Gmail connection is attached in the Connector Hub; the `document.parse`/`ai.action` steps need
a funded LLM key to produce the recommendation.
```bash
# backend (from ai-backend/): build the /submission op + re-seed triage v2.1.0
docker compose -f deploy/docker-compose.yml --env-file .env up -d --build connectors workflows seed
```

## Wiring roadmap (tracks `ai-backend/docs/INSURANCE_VERTICAL.md`)
1. **Live pack** — rebuild backend; `/industries` + `/workspace/config` return insurance (no code). ✅ pack validated
2. **FE auth** — `DUMMY_AUTH=false` + real signup (`login_source:"insurance"`). ✅ done
3. **Submissions/queues** — client on `/packs/*`; queue + run view + "Run triage" trigger. ✅ done
4. **Rules Core** → `app.rules` reads the real registry; `lib/rules.ts` deleted. ✅ done
5. **Runnable triage** — high-level Gmail `/submission` op feeds `submission_triage` end-to-end. ✅ done
6. **Grounded Copilot** (`/orchestrator/copilot`) → per-submission, cited panel on the detail. ✅ done
7. **AI Assistant** → full chat + Conversations sidebar (real sessions/history) + run cards. ✅ done
8. **Wire the static tabs** (highest ROI, see scorecard) — point Document Intelligence at
   `app.documents`; wire Workflows→`usePackRuns`, Connectors→`listConnectors`. ⏳ next
9. **Approvals V2** — reason codes / override / history. ⏳
10. Replace the generic `industries.ts` insurance copy with the MGA Submission-Triage content. ⏳

## Conventions
- Add a backend call: one typed fn in `client.ts`, wrap in a hook under `api/query|mutation`, export
  from `api/index.ts`, consume in the page.
- Every data view uses the shared `LoadingState` / `EmptyState` / `ErrorState`
  (`components/common/states.tsx`).
- Never call a service or Keycloak directly; always go through the gateway.
- Insurance is a **declarative pack** on the backend — the FE consumes the generic pack/workflow API
  with insurance keys; it does **not** get bespoke insurance services.
