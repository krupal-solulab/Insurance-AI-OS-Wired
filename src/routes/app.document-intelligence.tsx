import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileSearch,
  FileStack,
  FileText,
  HeartPulse,
  Landmark,
  Printer,
  ScanLine,
  ScrollText,
  Search,
  Send,
  Share2,
  Sparkles,
  Table2,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/document-intelligence")({
  component: DocumentIntelligencePage,
});

/* ─────────────────────────  Dummy data (insurance)  ───────────────────────── */

type DocType =
  | "policy-application"
  | "claim-form"
  | "medical-report"
  | "kyc-document"
  | "premium-invoice"
  | "loss-assessment";
type Tone = "good" | "warn" | "bad" | "neutral";

interface Field {
  label: string;
  value: string;
  confidence: number; // 0-100
}
interface MatchLine {
  item: string;
  source: string;
  qty?: string;
  unitPrice?: string;
  lineTotal?: string;
}
interface DocRisk {
  severity: "low" | "medium" | "high";
  text: string;
}
interface DocActionItem {
  text: string;
  owner: string;
  due: string;
  done: boolean;
}
interface DocumentItem {
  id: string;
  type: DocType;
  title: string;
  vendor: string;
  category: string;
  status: string;
  statusTone: Tone;
  date: string;
  author: string;
  pages: number;
  sizeKb: number;
  amount: string;
  confidence: number; // overall extraction confidence 0-100
  tags: string[];
  previewLines: string[];
  fields: Field[];
  gl?: MatchLine[];
  aiSummary: { text: string; bullets: string[] };
  risks: DocRisk[];
  actionItems: DocActionItem[];
  relatedIds: string[];
}

const docTypeMeta: Record<DocType, { label: string; plural: string }> = {
  "policy-application": { label: "Policy Application", plural: "Applications" },
  "claim-form": { label: "Claim Form", plural: "Claims" },
  "medical-report": { label: "Medical Report", plural: "Medical Reports" },
  "kyc-document": { label: "KYC Document", plural: "KYC Docs" },
  "premium-invoice": { label: "Premium Invoice", plural: "Invoices" },
  "loss-assessment": { label: "Loss Assessment", plural: "Loss Assessments" },
};

const docTypeIcon: Record<DocType, LucideIcon> = {
  "policy-application": ScrollText,
  "claim-form": FileCheck2,
  "medical-report": HeartPulse,
  "kyc-document": Landmark,
  "premium-invoice": FileText,
  "loss-assessment": FileSearch,
};

const docTypeColor: Record<DocType, string> = {
  "policy-application": "text-amber-500",
  "claim-form": "text-sky-500",
  "medical-report": "text-violet-500",
  "kyc-document": "text-emerald-500",
  "premium-invoice": "text-primary",
  "loss-assessment": "text-rose-500",
};

const severityTone: Record<DocRisk["severity"], Tone> = {
  low: "good",
  medium: "warn",
  high: "bad",
};

const documents: DocumentItem[] = [
  {
    id: "pol-2214",
    type: "policy-application",
    title: "POL-2214 — Daniel Okafor (Term Life)",
    vendor: "Daniel Okafor",
    category: "Underwriting",
    status: "Needs Approval",
    statusTone: "warn",
    date: "Jul 08, 2026",
    author: "Underwriting Inbox",
    pages: 3,
    sizeKb: 486,
    amount: "$500,000.00",
    confidence: 97,
    tags: ["underwriting", "term-life", "new-business"],
    previewLines: [
      "POLICY APPLICATION",
      "Daniel Okafor · POL-2214",
      "Product: Term Life · Term: 20 years",
      "Application date: Jul 08, 2026 · Effective: Jul 22, 2026",
      "COVERAGE",
      "Sum insured — $500,000.00",
      "Annual premium — $1,240.00",
      "Rider — Accidental death benefit",
      "SUM INSURED",
      "$500,000.00",
    ],
    fields: [
      { label: "Policyholder", value: "Daniel Okafor", confidence: 99 },
      { label: "Policy number", value: "POL-2214", confidence: 99 },
      { label: "Application date", value: "Jul 08, 2026", confidence: 98 },
      { label: "Effective date", value: "Jul 22, 2026", confidence: 97 },
      { label: "Product", value: "Term Life · 20 yr", confidence: 96 },
      { label: "Sum insured", value: "$500,000.00", confidence: 95 },
      { label: "Annual premium", value: "$1,240.00", confidence: 94 },
      { label: "Smoker declaration", value: "Non-smoker", confidence: 71 },
      { label: "Sum insured", value: "$500,000.00", confidence: 99 },
      { label: "Rider", value: "Accidental death", confidence: 93 },
      { label: "Beneficiary", value: "Amara Okafor", confidence: 95 },
    ],
    gl: [
      { item: "Base term life cover", source: "Sum insured", qty: "$500,000", unitPrice: "$980.00", lineTotal: "$980.00" },
      { item: "Accidental death rider", source: "Rider", qty: "$100,000", unitPrice: "$180.00", lineTotal: "$180.00" },
      { item: "Policy fee", source: "Schedule", qty: "1", unitPrice: "$80.00", lineTotal: "$80.00" },
    ],
    aiSummary: {
      text: "This **policy application** requests **$500,000.00** of term life cover for Daniel Okafor at an annual premium of $1,240.00. Copilot validated the applicant and checked the premium against the rating table.",
      bullets: [
        "Applicant validated against the customer master and KYC record.",
        "No duplicate application found for this applicant in the last 90 days.",
        "Premium is within the rating-table tolerance for the risk class.",
      ],
    },
    risks: [
      { severity: "medium", text: "Smoker declaration confidence is 71% — verify against the medical report." },
      { severity: "low", text: "Effective date leaves a 3-day gap before the first premium is due." },
    ],
    actionItems: [
      { text: "Confirm smoker status with the applicant's medical report.", owner: "A. Reyes", due: "Jul 12", done: false },
      { text: "Route to the underwriter for approval.", owner: "Underwriting Copilot", due: "Jul 12", done: false },
    ],
    relatedIds: ["med-4482", "kyc-8841"],
  },
  {
    id: "clm-8841",
    type: "claim-form",
    title: "CLM-8841 — Motor Claim, Priya Nair",
    vendor: "Priya Nair",
    category: "Claims",
    status: "Duplicate Flagged",
    statusTone: "bad",
    date: "Jul 09, 2026",
    author: "Claims Inbox",
    pages: 2,
    sizeKb: 312,
    amount: "$6,540.00",
    confidence: 88,
    tags: ["claim", "motor", "fraud-review"],
    previewLines: [
      "CLAIM FORM",
      "Priya Nair · Claim CLM-8841",
      "Policy: POL-8790 · Motor Comprehensive",
      "Incident date: Jul 02, 2026",
      "Loss: front-end collision, vehicle damage",
      "CLAIM AMOUNT",
      "$6,540.00 — deductible $500.00",
    ],
    fields: [
      { label: "Claimant", value: "Priya Nair", confidence: 98 },
      { label: "Claim number", value: "CLM-8841", confidence: 97 },
      { label: "Claim date", value: "Jul 09, 2026", confidence: 96 },
      { label: "Incident date", value: "Jul 02, 2026", confidence: 95 },
      { label: "Policy number", value: "POL-8790", confidence: 82 },
      { label: "Claim amount", value: "$6,540.00", confidence: 99 },
      { label: "Deductible", value: "$500.00", confidence: 93 },
    ],
    gl: [
      { item: "Claimed amount (claim form)", source: "CLM-8841", qty: "1 claim", unitPrice: "$6,540.00", lineTotal: "$6,540.00" },
      { item: "Assessed amount (loss assessment)", source: "LOS-8790", qty: "1 claim", unitPrice: "$6,200.00", lineTotal: "$6,200.00" },
      { item: "Payable after deductible", source: "Policy POL-8790", qty: "1 claim", unitPrice: "—", lineTotal: "$5,700.00" },
    ],
    aiSummary: {
      text: "This **claim** from Priya Nair for **$6,540.00** closely matches a previously filed claim and exceeds the loss assessment by $340.00. Copilot flagged it as a **likely duplicate** with an assessment variance.",
      bullets: [
        "Amount and claimant match claim CLM-8798 filed on Jun 28, 2026.",
        "Claimed amount is $340.00 over the assessed loss and policy limit.",
        "Held from the settlement run pending investigation.",
      ],
    },
    risks: [{ severity: "high", text: "Potential duplicate settlement of $6,540.00 if approved without review." }],
    actionItems: [
      { text: "Compare against CLM-8798 and confirm with the claimant.", owner: "J. Lin", due: "Jul 11", done: false },
      { text: "Resolve the $340.00 assessment variance.", owner: "Claims Lead", due: "Jul 11", done: false },
    ],
    relatedIds: ["loss-8790", "pol-2214"],
  },
  {
    id: "med-4482",
    type: "medical-report",
    title: "Medical Report — MR-0912, Daniel Okafor",
    vendor: "St. Meridian Hospital",
    category: "Underwriting",
    status: "Matched",
    statusTone: "good",
    date: "Jul 05, 2026",
    author: "Google Drive",
    pages: 4,
    sizeKb: 92,
    amount: "—",
    confidence: 93,
    tags: ["medical", "diagnosis", "underwriting"],
    previewLines: [
      "MEDICAL REPORT",
      "Report MR-0912 · Daniel Okafor",
      "Facility: St. Meridian Hospital",
      "Diagnosis I10 — Essential hypertension",
      "Diagnosis E78.5 — Hyperlipidemia",
      "Blood pressure 138/88 · BMI 27.4",
      "SUMMARY",
      "Controlled, low-risk profile",
    ],
    fields: [
      { label: "Patient", value: "Daniel Okafor", confidence: 96 },
      { label: "Report number", value: "MR-0912", confidence: 97 },
      { label: "Diagnosis code", value: "I10", confidence: 95 },
      { label: "Diagnosis code", value: "E78.5", confidence: 92 },
      { label: "Blood pressure", value: "138/88", confidence: 88 },
      { label: "BMI", value: "27.4", confidence: 99 },
      { label: "Risk profile", value: "Low", confidence: 98 },
    ],
    gl: [
      { item: "Essential hypertension", source: "ICD I10", qty: "controlled", unitPrice: "+0.25", lineTotal: "loading" },
      { item: "Hyperlipidemia", source: "ICD E78.5", qty: "controlled", unitPrice: "+0.10", lineTotal: "loading" },
      { item: "Baseline mortality", source: "Age band", qty: "1", unitPrice: "1.00", lineTotal: "base" },
    ],
    aiSummary: {
      text: "A **medical report** for applicant Daniel Okafor recording **two controlled conditions** and an otherwise low-risk profile. Copilot matched the diagnosis codes against the underwriting guidelines.",
      bullets: [
        "Both diagnosis codes are controlled — no decline trigger.",
        "Vitals are within the standard-rate underwriting band.",
        "Ready to attach to application POL-2214 for the risk score.",
      ],
    },
    risks: [{ severity: "low", text: "Blood-pressure reading confidence is 88% — verify against the lab attachment." }],
    actionItems: [{ text: "Attach the report to POL-2214 for the underwriting file.", owner: "M. Okafor", due: "Jul 10", done: true }],
    relatedIds: ["pol-2214"],
  },
  {
    id: "kyc-8841",
    type: "kyc-document",
    title: "KYC Document KYC-4482 — Daniel Okafor",
    vendor: "Daniel Okafor",
    category: "Compliance & KYC",
    status: "Received",
    statusTone: "neutral",
    date: "Jul 01, 2026",
    author: "Gmail",
    pages: 2,
    sizeKb: 254,
    amount: "—",
    confidence: 96,
    tags: ["kyc", "identity", "POL-2214"],
    previewLines: [
      "KYC DOCUMENT",
      "KYC-4482 · Daniel Okafor",
      "Against POL-2214 · Identity verification",
      "ID type: Passport · No. P8842190",
      "Address proof — utility bill on file",
      "SCREENING RESULT",
      "No sanctions / PEP match",
    ],
    fields: [
      { label: "KYC reference", value: "KYC-4482", confidence: 99 },
      { label: "Customer", value: "Daniel Okafor", confidence: 98 },
      { label: "Policy reference", value: "POL-2214", confidence: 97 },
      { label: "ID type", value: "Passport", confidence: 94 },
      { label: "ID number", value: "P8842190", confidence: 96 },
      { label: "Address proof", value: "Utility bill", confidence: 90 },
      { label: "Screening result", value: "No match", confidence: 92 },
    ],
    gl: [
      { item: "Identity verification", source: "Passport P8842190", qty: "1", unitPrice: "pass", lineTotal: "verified" },
      { item: "Address verification", source: "Utility bill", qty: "1", unitPrice: "pass", lineTotal: "verified" },
      { item: "Sanctions / PEP screen", source: "Watchlist", qty: "1", unitPrice: "clear", lineTotal: "no match" },
    ],
    aiSummary: {
      text: "**KYC document** KYC-4482 verifies the identity of Daniel Okafor against application POL-2214. Copilot confirmed the ID and ran a **clean sanctions and PEP screen**.",
      bullets: [
        "Passport P8842190 matches the applicant name on POL-2214.",
        "Address proof is current and consistent with the application.",
        "Linked to POL-2214 for downstream underwriting approval.",
      ],
    },
    risks: [{ severity: "medium", text: "Address-proof confidence is 90% — confirm the utility bill is within 3 months." }],
    actionItems: [{ text: "Confirm the utility bill date meets the KYC policy.", owner: "Compliance", due: "Jul 07", done: false }],
    relatedIds: ["pol-2214"],
  },
  {
    id: "inv-118",
    type: "premium-invoice",
    title: "Premium Invoice PRM-118 — Priya Nair",
    vendor: "Priya Nair",
    category: "Billing",
    status: "Needs Approval",
    statusTone: "warn",
    date: "Jul 06, 2026",
    author: "R. Danforth",
    pages: 1,
    sizeKb: 240,
    amount: "$1,860.00",
    confidence: 91,
    tags: ["premium", "billing", "reconciliation"],
    previewLines: [
      "PREMIUM INVOICE",
      "PRM-118 · Priya Nair",
      "Policy: POL-8790 · Motor Comprehensive",
      "Base premium — $1,600.00",
      "Insurance levy — $180.00",
      "Broker commission — $80.00",
      "AMOUNT DUE",
      "$1,860.00 — payment pending",
    ],
    fields: [
      { label: "Invoice number", value: "PRM-118", confidence: 97 },
      { label: "Policyholder", value: "Priya Nair", confidence: 99 },
      { label: "Policy number", value: "POL-8790", confidence: 95 },
      { label: "Base premium", value: "$1,600.00", confidence: 96 },
      { label: "Insurance levy", value: "$180.00", confidence: 88 },
      { label: "Broker", value: "Harbor Insurance Brokers", confidence: 93 },
      { label: "Payment status", value: "Pending", confidence: 90 },
    ],
    gl: [
      { item: "Base premium", source: "Billed", qty: "1", unitPrice: "$1,600.00", lineTotal: "$1,600.00" },
      { item: "Insurance levy", source: "Billed", qty: "1", unitPrice: "$180.00", lineTotal: "$180.00" },
      { item: "Broker commission", source: "Billed", qty: "1", unitPrice: "$80.00", lineTotal: "$80.00" },
    ],
    aiSummary: {
      text: "A **premium invoice** PRM-118 billing **$1,860.00** to Priya Nair on policy POL-8790. Copilot confirmed the line items against the policy schedule but the **payment is still pending**.",
      bullets: [
        "Invoice lines match the policy schedule for POL-8790 exactly.",
        "Broker Harbor Insurance Brokers assigned for this policy.",
        "Payment not yet received against the invoice.",
      ],
    },
    risks: [{ severity: "medium", text: "Payment is unreceived — cannot activate coverage or reconcile the premium." }],
    actionItems: [
      { text: "Chase the broker for the outstanding premium payment.", owner: "Billing Desk", due: "Jul 10", done: false },
      { text: "Confirm the levy rate with the policyholder's region.", owner: "Billing Desk", due: "Jul 10", done: false },
    ],
    relatedIds: ["clm-8841", "loss-8790"],
  },
  {
    id: "loss-8790",
    type: "loss-assessment",
    title: "Loss Assessment LOS-8790 — Priya Nair",
    vendor: "Priya Nair",
    category: "Claims",
    status: "In Review",
    statusTone: "neutral",
    date: "Jun 22, 2026",
    author: "Claims Inbox",
    pages: 3,
    sizeKb: 640,
    amount: "$6,200.00",
    confidence: 94,
    tags: ["assessment", "vehicle-damage", "CLM-8841"],
    previewLines: [
      "LOSS ASSESSMENT",
      "LOS-8790 · Priya Nair",
      "Claim CLM-8841 · Motor Comprehensive",
      "Adjuster: T. Alvarez",
      "Front bumper, radiator, headlamp assembly",
      "ASSESSED LOSS",
      "$6,200.00 · repairable",
    ],
    fields: [
      { label: "Assessment number", value: "LOS-8790", confidence: 98 },
      { label: "Claimant", value: "Priya Nair", confidence: 97 },
      { label: "Claim number", value: "CLM-8841", confidence: 95 },
      { label: "Adjuster", value: "T. Alvarez", confidence: 92 },
      { label: "Damage scope", value: "Front-end, repairable", confidence: 96 },
      { label: "Incident date", value: "Jul 02, 2026", confidence: 90 },
      { label: "Assessed loss", value: "$6,200.00", confidence: 94 },
    ],
    gl: [
      { item: "Assessed repair cost", source: "LOS-8790", qty: "1 vehicle", unitPrice: "$6,200.00", lineTotal: "$6,200.00" },
    ],
    aiSummary: {
      text: "**Loss assessment** LOS-8790 values the front-end vehicle damage on claim CLM-8841 at **$6,200.00**, repairable, per adjuster T. Alvarez. Copilot linked it to CLM-8841 and the premium invoice.",
      bullets: [
        "Adjuster T. Alvarez confirmed the damage scope on-site.",
        "Assessed loss of $6,200.00 is below the claimed amount.",
        "Assessment ties to CLM-8841 for settlement calculation.",
      ],
    },
    risks: [{ severity: "low", text: "Adjuster site visit was 2 days after the reported incident date." }],
    actionItems: [
      { text: "Finalize the settlement figure for claim CLM-8841.", owner: "Claims Team", due: "Jul 02", done: false },
      { text: "Attach repair-shop photos to the assessment file.", owner: "Claims Team", due: "Jul 02", done: false },
    ],
    relatedIds: ["clm-8841", "kyc-8841"],
  },
];

function getDocumentsByIds(ids: string[]): DocumentItem[] {
  return ids.map((id) => documents.find((d) => d.id === id)).filter((d): d is DocumentItem => Boolean(d));
}

/* ─────────────────────────  Shared helpers  ───────────────────────── */

const PANEL = "rounded-2xl border border-border bg-surface";

function toneBadgeCls(tone: Tone) {
  switch (tone) {
    case "good":
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-500";
    case "warn":
      return "bg-amber-500/10 border-amber-500/30 text-amber-500";
    case "bad":
      return "bg-destructive/10 border-destructive/30 text-destructive";
    default:
      return "bg-muted border-border text-foreground";
  }
}

function confColor(c: number) {
  return c >= 90 ? "text-emerald-500" : c >= 75 ? "text-amber-500" : "text-destructive";
}
function confBar(c: number) {
  return c >= 90 ? "bg-emerald-500" : c >= 75 ? "bg-amber-500" : "bg-destructive";
}

function SectionHeader({
  icon: Icon,
  title,
  hint,
  right,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border px-5 py-4">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}

function ConfidenceRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  const stroke = value >= 90 ? "stroke-emerald-500" : value >= 75 ? "stroke-amber-500" : "stroke-destructive";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="stroke-surface-2" strokeWidth={3} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn(stroke, "transition-all")}
          strokeWidth={3}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn("absolute text-[11px] font-semibold tabular-nums", confColor(value))}>{value}</span>
    </div>
  );
}

/* ─────────────────────────  Page  ───────────────────────── */

function DocumentIntelligencePage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | DocType>("all");
  const [selectedId, setSelectedId] = useState<string>(documents[0].id);
  const [aiOpen, setAiOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = documents;
    if (typeFilter !== "all") list = list.filter((d) => d.type === typeFilter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.vendor.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [query, typeFilter]);

  const selected = documents.find((d) => d.id === selectedId) ?? filtered[0] ?? documents[0];

  const totalValue = documents.length;
  const needApproval = documents.filter((d) => d.status.includes("Approval")).length;
  const avgConf = Math.round(documents.reduce((s, d) => s + d.confidence, 0) / documents.length);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Document Intelligence
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Document workspace</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            AI reads policy applications, claim forms, medical reports, and KYC docs — extracting clean,
            insurance-ready data with a confidence score on every field.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 rounded-lg border border-border bg-surface px-3.5 text-xs font-medium transition hover:border-primary/50 hover:text-primary">
            Upload document
          </button>
          <button
            onClick={() => setAiOpen((o) => !o)}
            aria-pressed={aiOpen}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold shadow-sm transition",
              aiOpen
                ? "brand-gradient text-primary-foreground shadow-primary/25 hover:opacity-90"
                : "border border-border bg-surface text-foreground hover:border-primary/50 hover:text-primary",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {aiOpen ? "Hide AI Copilot" : "Ask AI Copilot"}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniKpi icon={FileStack} label="Indexed" value={String(totalValue)} />
        <MiniKpi icon={ClipboardCheck} label="Need approval" value={String(needApproval)} tone="text-amber-500" />
        <MiniKpi icon={ScanLine} label="Avg. confidence" value={`${avgConf}%`} tone={confColor(avgConf)} />
        <MiniKpi icon={CheckCircle2} label="Auto-matched" value="96%" tone="text-emerald-500" />
      </div>

      {/* Workspace — responsive grid: fixed rail · fluid center · dockable AI panel */}
      <div
        className={cn(
          "grid grid-cols-1 items-start gap-6 lg:gap-8",
          aiOpen
            ? "lg:grid-cols-[272px_minmax(0,1fr)_360px]"
            : "lg:grid-cols-[272px_minmax(0,1fr)]",
        )}
      >
        {/* Left rail — document list */}
        <div className="lg:sticky lg:top-6">
          <DocumentBrowser
            query={query}
            setQuery={setQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            documentsList={filtered}
            selectedId={selected.id}
            onSelect={setSelectedId}
          />
        </div>

        {/* Center — the document (primary focus) */}
        <div className="min-w-0 space-y-6">
          <DocumentViewer doc={selected} />
          <ExtractedFieldsCard doc={selected} />
          {selected.gl && <GlCodingCard doc={selected} />}
          <AiSummaryCard doc={selected} />
          <ExtractedRisksCard doc={selected} />
          <ActionItemsCard doc={selected} />
          <RelatedDocumentsCard doc={selected} onSelect={setSelectedId} />
        </div>

        {/* Right — dockable AI copilot */}
        {aiOpen && (
          <div className="min-w-0 lg:sticky lg:top-6">
            <AskAiPanel doc={selected} onClose={() => setAiOpen(false)} />
          </div>
        )}
      </div>

      {/* Floating AI Copilot launcher — opens the dockable panel */}
      {!aiOpen && (
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          aria-label="Open AI Copilot"
          className="brand-gradient group fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full py-3 pl-3 pr-4 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/30 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:opacity-95"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Ask AI Copilot</span>
        </button>
      )}
    </div>
  );
}

function MiniKpi({
  icon: Icon,
  label,
  value,
  tone = "text-foreground",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className={cn(PANEL, "flex items-center gap-3 p-3")}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={cn("text-lg font-semibold tabular-nums", tone)}>{value}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────  Left: Smart Search + Browser  ───────────────────────── */

function DocumentBrowser({
  query,
  setQuery,
  typeFilter,
  setTypeFilter,
  documentsList,
  selectedId,
  onSelect,
}: {
  query: string;
  setQuery: (v: string) => void;
  typeFilter: "all" | DocType;
  setTypeFilter: (v: "all" | DocType) => void;
  documentsList: DocumentItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const types: DocType[] = [
    "policy-application",
    "claim-form",
    "medical-report",
    "kyc-document",
    "premium-invoice",
    "loss-assessment",
  ];

  return (
    <section className={cn(PANEL, "flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden")}>
      <div className="space-y-3 border-b border-border p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Smart search — policyholder, type, tag…"
            className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
            All
          </FilterChip>
          {types.map((t) => (
            <FilterChip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
              {docTypeMeta[t].plural}
            </FilterChip>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {documentsList.length} result{documentsList.length === 1 ? "" : "s"}
        </div>
      </div>
      <ul className="nice-scroll flex-1 divide-y divide-border overflow-y-auto">
        {documentsList.map((d) => {
          const Icon = docTypeIcon[d.type];
          const active = d.id === selectedId;
          return (
            <li key={d.id}>
              <button
                onClick={() => onSelect(d.id)}
                className={cn(
                  "flex w-full gap-3 border-l-2 px-4 py-3 text-left transition-colors",
                  active ? "border-l-primary bg-surface-2" : "border-l-transparent hover:bg-surface-2/60",
                )}
              >
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", docTypeColor[d.type])} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.title}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="truncate">{d.vendor}</span>
                    <span>·</span>
                    <span className="font-mono">{d.amount}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-block rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wider",
                        toneBadgeCls(d.statusTone),
                      )}
                    >
                      {d.status}
                    </span>
                    <span className={cn("text-[9px] font-semibold tabular-nums", confColor(d.confidence))}>
                      {d.confidence}%
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
        {documentsList.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">
            No documents match this search.
          </li>
        )}
      </ul>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────  Center: Document Viewer  ───────────────────────── */

function DocumentViewer({ doc }: { doc: DocumentItem }) {
  const Icon = docTypeIcon[doc.type];
  return (
    <section className={cn(PANEL, "overflow-hidden")}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-surface-2">
            <Icon className={cn("h-5 w-5", docTypeColor[doc.type])} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-snug">{doc.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {doc.vendor}
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {doc.author}
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {doc.date}
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <FileStack className="h-3 w-3" /> {doc.pages}pg · {(doc.sizeKb / 1024).toFixed(1)}MB
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <ConfidenceRing value={doc.confidence} />
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Extraction</div>
              <div className={cn("text-xs font-semibold", confColor(doc.confidence))}>confidence</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {[Download, Printer, Share2].map((Btn, i) => (
              <button
                key={i}
                className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
              >
                <Btn className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="bg-surface-2/40 p-6">
        <TextPreview doc={doc} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-5 py-2.5">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
            toneBadgeCls(doc.statusTone),
          )}
        >
          {doc.status}
        </span>
        {doc.tags.map((t) => (
          <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

function TextPreview({ doc }: { doc: DocumentItem }) {
  return (
    <div className="min-h-[240px] w-full rounded-md border border-border bg-card p-8 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {docTypeMeta[doc.type].label} · {doc.id.toUpperCase()}
        </div>
        <div className="font-mono text-sm font-semibold text-primary">{doc.amount}</div>
      </div>
      <div className="space-y-3">
        {doc.previewLines.map((line, i) => {
          const isHeading = line === line.toUpperCase() && line.length < 40;
          return (
            <p
              key={i}
              className={
                isHeading
                  ? "pt-2 text-xs font-semibold tracking-wider text-primary"
                  : "text-sm leading-relaxed text-foreground/90"
              }
            >
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────  Extracted Fields  ───────────────────────── */

function ExtractedFieldsCard({ doc }: { doc: DocumentItem }) {
  const low = doc.fields.filter((f) => f.confidence < 80).length;
  return (
    <section className={cn(PANEL, "overflow-hidden")}>
      <SectionHeader
        icon={ScanLine}
        title="Extracted Fields"
        hint={`${doc.fields.length} fields · ${low} need review`}
        right={
          <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            OCR + AI
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {doc.fields.map((f) => (
          <div key={f.label} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</span>
              <span className={cn("text-[10px] font-semibold tabular-nums", confColor(f.confidence))}>
                {f.confidence}%
              </span>
            </div>
            <div className="mt-0.5 truncate text-sm font-medium text-foreground">{f.value}</div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
              <div className={cn("h-full rounded-full", confBar(f.confidence))} style={{ width: `${f.confidence}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────  GL Coding  ───────────────────────── */

function GlCodingCard({ doc }: { doc: DocumentItem }) {
  if (!doc.gl) return null;
  return (
    <section className={cn(PANEL, "overflow-hidden")}>
      <SectionHeader icon={Table2} title="Line-Item Validation" hint="Coverage & amount check — review before approval" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-2 font-medium">Item</th>
              <th className="px-5 py-2 font-medium">Source</th>
              <th className="px-5 py-2 text-right font-medium">Qty</th>
              <th className="px-5 py-2 text-right font-medium">Unit price</th>
              <th className="px-5 py-2 text-right font-medium">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {doc.gl.map((l, i) => (
              <tr key={i}>
                <td className="px-5 py-2 font-medium">{l.item}</td>
                <td className="px-5 py-2 font-mono text-xs text-muted-foreground">{l.source}</td>
                <td className="px-5 py-2 text-right font-mono tabular-nums">{l.qty ?? "—"}</td>
                <td className="px-5 py-2 text-right font-mono tabular-nums">{l.unitPrice ?? "—"}</td>
                <td className="px-5 py-2 text-right font-mono tabular-nums">{l.lineTotal ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─────────────────────────  AI Summary  ───────────────────────── */

function renderBold(text: string) {
  return text.split(/(\*\*.+?\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function AiSummaryCard({ doc }: { doc: DocumentItem }) {
  return (
    <section className={cn(PANEL, "overflow-hidden")}>
      <SectionHeader icon={Sparkles} title="AI Summary" hint="Synthesized directly from this document" />
      <div className="p-5">
        <p className="text-sm leading-relaxed">{renderBold(doc.aiSummary.text)}</p>
        <ul className="mt-3 space-y-1.5">
          {doc.aiSummary.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground/90">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────  Extracted Risks  ───────────────────────── */

function ExtractedRisksCard({ doc }: { doc: DocumentItem }) {
  return (
    <section className={cn(PANEL, "overflow-hidden")}>
      <SectionHeader
        icon={AlertTriangle}
        title="Extracted Risks"
        hint={`${doc.risks.length} risk signal(s) found by Copilot`}
      />
      <ul className="divide-y divide-border">
        {doc.risks.map((r, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3">
            <span
              className={cn(
                "mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wider",
                toneBadgeCls(severityTone[r.severity]),
              )}
            >
              {r.severity}
            </span>
            <p className="text-xs leading-relaxed text-foreground/90">{r.text}</p>
          </li>
        ))}
        {doc.risks.length === 0 && (
          <li className="px-5 py-6 text-center text-xs text-muted-foreground">
            No risks were extracted from this document.
          </li>
        )}
      </ul>
    </section>
  );
}

/* ─────────────────────────  Action Items  ───────────────────────── */

function ActionItemsCard({ doc }: { doc: DocumentItem }) {
  const [done, setDone] = useState<Set<number>>(
    () => new Set(doc.actionItems.map((a, i) => (a.done ? i : -1)).filter((i) => i >= 0)),
  );

  return (
    <section className={cn(PANEL, "overflow-hidden")}>
      <SectionHeader icon={CheckCircle2} title="Action Items" hint="Tracked to closure by Copilot" />
      <ul className="divide-y divide-border">
        {doc.actionItems.map((a, i) => {
          const isDone = done.has(i);
          return (
            <li key={i} className="flex items-start gap-3 px-5 py-3">
              <button
                onClick={() =>
                  setDone((s) => {
                    const next = new Set(s);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  })
                }
                className="mt-0.5 shrink-0"
                aria-label={isDone ? "Mark as not done" : "Mark as done"}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", isDone ? "text-muted-foreground line-through" : "text-foreground/90")}>
                  {a.text}
                </p>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {a.owner} · Due {a.due}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─────────────────────────  Related Documents  ───────────────────────── */

function RelatedDocumentsCard({ doc, onSelect }: { doc: DocumentItem; onSelect: (id: string) => void }) {
  const related = getDocumentsByIds(doc.relatedIds);
  return (
    <section className={cn(PANEL, "overflow-hidden")}>
      <SectionHeader icon={FileStack} title="Related Documents" hint="Linked by policyholder and case" />
      <div className="grid grid-cols-1 gap-2.5 p-4 md:grid-cols-3">
        {related.map((r) => {
          const Icon = docTypeIcon[r.type];
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="rounded-lg border border-border bg-surface-2/40 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40"
            >
              <Icon className={cn("h-4 w-4", docTypeColor[r.type])} />
              <div className="mt-2 line-clamp-2 text-xs font-medium leading-snug">{r.title}</div>
              <div className="mt-1 truncate text-[10px] text-muted-foreground">{r.vendor}</div>
            </button>
          );
        })}
        {related.length === 0 && (
          <div className="col-span-full py-4 text-center text-sm text-muted-foreground">
            No related documents found for this item.
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────  Right: Ask AI About This Document  ───────────────────────── */

interface AssistantMsg {
  role: "user" | "assistant";
  text: string;
}

function AskAiPanel({ doc, onClose }: { doc: DocumentItem; onClose?: () => void }) {
  const [messages, setMessages] = useState<AssistantMsg[]>([]);
  const [input, setInput] = useState("");

  const reply = (q: string): string => {
    const p = q.toLowerCase();
    if (p.includes("risk"))
      return doc.risks.length
        ? `${doc.risks.length} risk(s) found: ${doc.risks.map((r) => r.text).join(" ")}`
        : "No risks were extracted from this document.";
    if (p.includes("action") || p.includes("todo") || p.includes("next"))
      return `${doc.actionItems.length} action item(s): ${doc.actionItems
        .map((a) => `${a.text} (owner: ${a.owner}, due ${a.due})`)
        .join(" ")}`;
    if (p.includes("match") || p.includes("line") || p.includes("validation") || p.includes("item"))
      return doc.gl
        ? `Line-item validation: ${doc.gl
            .map((l) => `${l.item} [${l.source}] ${l.qty ?? "—"} @ ${l.unitPrice ?? "—"} = ${l.lineTotal ?? "—"}`)
            .join("; ")}.`
        : "No line-item validation was generated for this document type.";
    if (p.includes("amount") || p.includes("total") || p.includes("how much"))
      return `The total on this ${docTypeMeta[doc.type].label.toLowerCase()} is ${doc.amount}.`;
    if (p.includes("confidence") || p.includes("sure") || p.includes("accurate"))
      return `Overall extraction confidence is ${doc.confidence}%. Lowest-confidence field: ${
        doc.fields.reduce((a, b) => (b.confidence < a.confidence ? b : a)).label
      }.`;
    if (p.includes("summary") || p.includes("about") || p.includes("what is"))
      return doc.aiSummary.text.replace(/\*\*/g, "");
    if (p.includes("related") || p.includes("similar"))
      return `Related documents: ${
        getDocumentsByIds(doc.relatedIds)
          .map((r) => r.title)
          .join(", ") || "none found"
      }.`;
    if (p.includes("status"))
      return `This document is currently "${doc.status}", last touched ${doc.date} by ${doc.author}.`;
    return doc.aiSummary.text.replace(/\*\*/g, "");
  };

  const send = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }, { role: "assistant", text: reply(q) }]);
    setInput("");
  };

  const suggestions = ["Summarize this", "Any risks?", "Show the line-item match", "How confident are you?"];

  return (
    <section className={cn(PANEL, "flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden")}>
      <SectionHeader
        icon={Sparkles}
        title="Ask AI About This Document"
        hint={doc.title}
        right={
          onClose ? (
            <button
              onClick={onClose}
              aria-label="Close AI Copilot"
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : undefined
        }
      />
      <div className="nice-scroll flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Ask Copilot anything about{" "}
              <span className="font-medium text-foreground">{doc.title}</span> — try one of these:
            </p>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-surface-2"
              >
                {s}
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                m.role === "user"
                  ? "rounded-tr-sm bg-primary text-primary-foreground"
                  : "rounded-tl-sm border border-border bg-surface-2",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this document…"
          className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-xs outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-md text-primary-foreground shadow-sm shadow-primary/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </section>
  );
}
