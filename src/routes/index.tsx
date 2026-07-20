import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Cpu,
  Database,
  FileCheck2,
  FileText,
  Gauge,
  Globe,
  HeartPulse,
  Landmark,
  LifeBuoy,
  Lock,
  Mail,
  Moon,
  Plug,
  Scale,
  ScrollText,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  Table2,
  Umbrella,
  User,
  Users,
  Wand2,
  Workflow,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ApiError, api } from "../api";
import { IntegrationLogo } from "../components/common/IntegrationLogo";
import { LogoLockup } from "../components/common/LogoLockup";
import { setStoredIndustry } from "../lib/industries";
import { ThemeProvider, useTheme } from "../lib/theme";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

// ---------------- Content config ----------------

type WorkflowStep = { label: string; detail: string };
type WorkflowContent = {
  title: string;
  before: string;
  after: string;
  steps: WorkflowStep[];
};

const HERO = {
  tagline: "The AI underwriting triage copilot for MGAs.",
  sub: "Every broker submission — ACORD applications, loss runs, and financial statements — read, cross-checked, and scored against your appetite by AI. Missing information and risk flags surfaced, a recommendation drafted, and your underwriter stays in control of every decision.",
};

// The flagship submission-triage workflow shown in the before/after section.
const CLOSE_WORKFLOW: WorkflowContent = {
  title: "Submission to underwriter recommendation, in under 10 minutes.",
  before: "30+ minutes per submission, reading and comparing ACORD forms, loss runs, and financials by hand.",
  after: "Under 10 minutes: AI reads every document, applies your appetite, and drafts a recommendation — the underwriter reviews and decides.",
  steps: [
    { label: "Submission arrives", detail: "A broker emails a submission into your underwriting inbox." },
    { label: "Extract", detail: "Eagle Doc reads the ACORD application, loss runs, and financial statements." },
    { label: "Cross-check", detail: "Data compared across documents; missing information and mismatches flagged." },
    { label: "Appetite rules", detail: "State, industry, revenue, and loss thresholds checked against your appetite." },
    { label: "Risk summary", detail: "AI drafts a plain-language risk summary and recommendation for review." },
    { label: "Underwriter decides", detail: "Proceed, request more information, or decline — the human makes the call." },
  ],
};

// ---------------- Copilot library (interactive catalog) ----------------

type CopilotGroup = "underwriting" | "claims" | "risk";

type Copilot = {
  group: CopilotGroup;
  label: string;
  title: string;
  goal: string;
  persona: string;
  approver: string;
  trigger: string;
  actions: string[];
  value: string[];
  // The live trace shown in the modal — each line mirrors what the copilot does.
  trace: { kind: "run" | "ok" | "wait" | "done"; text: string }[];
  runtime: string;
};

const COPILOT_GROUPS: { slug: CopilotGroup | "all"; label: string }[] = [
  { slug: "all", label: "All" },
  { slug: "underwriting", label: "Underwriting & Policy" },
  { slug: "claims", label: "Claims & Service" },
  { slug: "risk", label: "Risk & Insights" },
];

const GROUP_META: Record<CopilotGroup, { label: string; accent: string }> = {
  // Restrained, insurance-appropriate accents so each family reads distinctly.
  underwriting: { label: "Underwriting & Policy", accent: "#3b82f6" },
  claims: { label: "Claims & Service", accent: "#f4c430" },
  risk: { label: "Risk & Insights", accent: "#38bdf8" },
};

const COPILOTS: Copilot[] = [
  {
    group: "underwriting",
    label: "Underwriting & Policy",
    title: "New Policy Underwriting Copilot",
    goal: "Extract policy applications, verify KYC, generate an AI risk score, and route for underwriter approval.",
    persona: "Underwriter",
    approver: "Underwriting Manager",
    trigger: "A customer emails a policy application to your underwriting inbox.",
    actions: [
      "Extracts applicant details, coverage, and declarations with Eagle Doc",
      "Verifies KYC against your policy admin records",
      "Detects duplicate applications",
      "Generates an AI risk score from the application data",
      "Writes a plain-language AI underwriting summary",
    ],
    value: [
      "No manual application data entry",
      "Duplicate and high-risk applications flagged before binding",
      "Faster underwriting approval cycles",
      "A clean, auditable trail on every policy",
    ],
    runtime: "2m 38s",
    trace: [
      { kind: "run", text: "connecting to Gmail…" },
      { kind: "ok", text: "reading APP_HARPER_0417.pdf" },
      { kind: "ok", text: "matched applicant: J. Harper" },
      { kind: "ok", text: "no duplicate application found" },
      { kind: "ok", text: "KYC verified · risk score computed" },
      { kind: "ok", text: "AI summary ready" },
      { kind: "wait", text: "waiting on approval (Underwriting Manager)" },
      { kind: "ok", text: "approved by A. Reyes" },
      { kind: "ok", text: "policy created in core system · docs archived to Drive" },
      { kind: "done", text: "done in 2m 38s" },
    ],
  },
  {
    group: "claims",
    label: "Claims & Service",
    title: "Claims Processing Copilot",
    goal: "Monitor open claims, predict settlement time, detect exceptions, and notify customers before issues escalate.",
    persona: "Claims Handler",
    approver: "Claims Manager",
    trigger: "A claim is submitted in your policy admin system, or on a claims sync.",
    actions: [
      "Retrieves live claim data from your policy admin system",
      "Predicts an updated settlement time with AI",
      "Detects claim delays and processing exceptions",
      "Runs claims-policy matching on active cases",
      "Notifies customers and claims teams proactively",
    ],
    value: [
      "Customers hear about status first, from you",
      "Fewer escalations and service failures",
      "Settlement times that reflect reality",
      "Claims teams see risk before it lands",
    ],
    runtime: "1m 52s",
    trace: [
      { kind: "run", text: "connecting to policy admin system…" },
      { kind: "ok", text: "retrieved 128 open claims" },
      { kind: "ok", text: "settlement time re-predicted for 19 claims" },
      { kind: "ok", text: "3 delays + 1 exception detected" },
      { kind: "ok", text: "claims-policy matching complete" },
      { kind: "wait", text: "waiting on approval (Claims Manager)" },
      { kind: "ok", text: "customers emailed · #claims-alerts pinged" },
      { kind: "done", text: "done in 1m 52s" },
    ],
  },
  {
    group: "underwriting",
    label: "Underwriting & Policy",
    title: "Customer Onboarding & KYC Copilot",
    goal: "Collect onboarding information, verify identity and financial documents, check for duplicate customers, and create customer records.",
    persona: "Onboarding Specialist",
    approver: "Underwriting Team",
    trigger: "A customer submits the onboarding form (Google Forms).",
    actions: [
      "Reads submitted identity and financial documents",
      "Verifies identity and validates financial documents",
      "Detects duplicate customers against your records",
      "Runs an AI risk assessment on the new customer",
      "Drafts the customer master record for approval",
    ],
    value: [
      "Faster, compliant customer onboarding",
      "No duplicate customer records",
      "Risk flagged before the first policy",
      "Complete documentation on file",
    ],
    runtime: "2m 20s",
    trace: [
      { kind: "run", text: "connecting to Google Forms…" },
      { kind: "ok", text: "onboarding + documents received" },
      { kind: "ok", text: "identity verified · financials validated" },
      { kind: "ok", text: "no duplicate customer found" },
      { kind: "ok", text: "AI risk assessment: low" },
      { kind: "wait", text: "waiting on approval (Underwriting Team)" },
      { kind: "ok", text: "customer created · docs stored to Drive" },
      { kind: "done", text: "done in 2m 20s" },
    ],
  },
  {
    group: "claims",
    label: "Claims & Service",
    title: "Fraud Detection Copilot",
    goal: "Identify suspicious claims, classify them by risk and severity, and draft an investigation action while keeping customers informed.",
    persona: "Claims Investigator",
    approver: "Claims Manager",
    trigger: "A claim update arrives from your policy admin system.",
    actions: [
      "Detects suspicious and anomalous claims automatically",
      "Flags inconsistent or unsupported claim details",
      "Classifies each claim by risk type and severity",
      "Drafts the investigation action and customer message",
      "Updates the case once claims approves",
    ],
    value: [
      "Fraudulent claims caught and escalated faster",
      "Customers kept informed automatically",
      "Consistent fraud triage",
      "Fewer improper payouts",
    ],
    runtime: "1m 34s",
    trace: [
      { kind: "run", text: "connecting to policy admin system…" },
      { kind: "ok", text: "claim updates ingested" },
      { kind: "ok", text: "2 anomalies · 1 high-risk claim detected" },
      { kind: "ok", text: "claims classified by severity" },
      { kind: "ok", text: "investigation actions + messages drafted" },
      { kind: "wait", text: "waiting on approval (Claims Manager)" },
      { kind: "ok", text: "customers notified · case updated" },
      { kind: "done", text: "done in 1m 34s" },
    ],
  },
  {
    group: "underwriting",
    label: "Underwriting & Policy",
    title: "Premium Reconciliation Copilot",
    goal: "Match premium payments to policies, detect variance against expected premiums, and route discrepancies for finance approval.",
    persona: "Premium Accounting Specialist",
    approver: "Finance Manager",
    trigger: "A premium payment record arrives in your inbox.",
    actions: [
      "Extracts the payment record with Eagle Doc",
      "Retrieves the matching policy and premium schedule",
      "Compares amounts and dates across all records",
      "Detects and explains any variance",
      "Writes an AI validation summary for finance",
    ],
    value: [
      "Underpayments caught before renewal",
      "Premium matching with no manual keying",
      "Faster, cleaner finance approvals",
      "A defensible audit trail",
    ],
    runtime: "2m 05s",
    trace: [
      { kind: "run", text: "connecting to Gmail…" },
      { kind: "ok", text: "reading PMT_HARPER_8841.pdf" },
      { kind: "ok", text: "POL-2214 + premium schedule retrieved" },
      { kind: "ok", text: "amounts compared · 1 variance found" },
      { kind: "ok", text: "variance summary drafted" },
      { kind: "wait", text: "waiting on approval (Finance Manager)" },
      { kind: "ok", text: "approved · core system updated" },
      { kind: "done", text: "done in 2m 05s" },
    ],
  },
  {
    group: "risk",
    label: "Risk & Insights",
    title: "Portfolio Risk Monitoring Copilot",
    goal: "Continuously monitor risk exposure, flag concentration, spot emerging loss trends, and recommend reinsurance or repricing.",
    persona: "Risk Analyst",
    approver: "Chief Risk Officer",
    trigger: "On a scheduled trigger, or on demand.",
    actions: [
      "Retrieves current portfolio exposure from your core system",
      "Detects concentration and high-exposure segments",
      "Identifies emerging loss trends",
      "Generates reinsurance and repricing recommendations",
      "Sends a Slack alert with a risk recommendation",
    ],
    value: [
      "Concentration risk surfaced with earlier warning",
      "Capital protected from adverse exposure",
      "Repricing decisions made with data",
      "Risk leadership looped in automatically",
    ],
    runtime: "1m 40s",
    trace: [
      { kind: "run", text: "scheduled trigger fired…" },
      { kind: "ok", text: "portfolio retrieved · 1,240 policies" },
      { kind: "ok", text: "17 high-exposure · 6 concentration flags" },
      { kind: "ok", text: "9 adverse loss trends flagged" },
      { kind: "ok", text: "reinsurance recommendations generated" },
      { kind: "wait", text: "waiting on approval (Chief Risk Officer)" },
      { kind: "ok", text: "#risk-alerts pinged · repricing recommended" },
      { kind: "done", text: "done in 1m 40s" },
    ],
  },
  {
    group: "risk",
    label: "Risk & Insights",
    title: "Claims Document Copilot",
    goal: "Extract structured data from claim forms, medical reports, and invoices to eliminate manual claims data entry.",
    persona: "Claims Document Specialist",
    approver: "Claims Team",
    trigger: "A document is uploaded to Google Drive.",
    actions: [
      "Extracts claim forms with Eagle Doc",
      "Extracts medical reports and validates invoices",
      "Generates document metadata automatically",
      "Stores metadata to Google Sheets",
      "Notifies the claims team on Slack",
    ],
    value: [
      "Manual claims data entry eliminated",
      "Accurate, searchable document metadata",
      "Claim documents reconciled faster",
      "Claims team notified in real time",
    ],
    runtime: "1m 12s",
    trace: [
      { kind: "run", text: "watching Google Drive…" },
      { kind: "ok", text: "reading claim_form_5521.pdf" },
      { kind: "ok", text: "medical report extracted" },
      { kind: "ok", text: "invoice validated" },
      { kind: "ok", text: "metadata written to Google Sheets" },
      { kind: "ok", text: "#claims pinged" },
      { kind: "done", text: "done in 1m 12s" },
    ],
  },
  {
    group: "risk",
    label: "Risk & Insights",
    title: "Insurance Executive Reporting Copilot",
    goal: "Generate AI-powered performance reports covering loss ratios, claims and underwriting KPIs, and premium and fraud analysis.",
    persona: "Insurance Operations Director",
    approver: "Finance Leadership",
    trigger: "On a scheduled reporting trigger.",
    actions: [
      "Retrieves operational data from your core system",
      "Analyzes loss ratios and underwriting performance",
      "Compiles claims KPIs and premium analysis",
      "Writes an AI executive summary",
      "Generates the report and emails leadership",
    ],
    value: [
      "Board-ready insurance reporting on demand",
      "One view across claims, underwriting, and premium",
      "Less time assembling spreadsheets",
      "Earlier visibility into loss and performance",
    ],
    runtime: "3m 08s",
    trace: [
      { kind: "run", text: "scheduled trigger fired…" },
      { kind: "ok", text: "operational data retrieved" },
      { kind: "ok", text: "loss ratio + underwriting performance analyzed" },
      { kind: "ok", text: "claims KPIs + premium analysis compiled" },
      { kind: "ok", text: "AI executive summary drafted" },
      { kind: "wait", text: "waiting on approval (Finance Leadership)" },
      { kind: "ok", text: "report stored to Drive · leadership emailed" },
      { kind: "done", text: "done in 3m 08s" },
    ],
  },
];

// ---------------- Integrations (insurance-focused) ----------------

type LandingIntegrationCategory =
  | "Core Systems"
  | "Email & Docs"
  | "Collaboration"
  | "Forms & Sheets";

type LandingIntegration = {
  slug: string;
  name: string;
  domain: string;
  category: LandingIntegrationCategory;
  logo?: string;
};

const INTEGRATION_CATEGORIES: LandingIntegrationCategory[] = [
  "Core Systems",
  "Email & Docs",
  "Collaboration",
  "Forms & Sheets",
];

const LANDING_INTEGRATIONS: LandingIntegration[] = [
  // Core Systems
  { slug: "salesforce", name: "Salesforce", domain: "salesforce.com", category: "Core Systems" },
  { slug: "hubspot", name: "HubSpot", domain: "hubspot.com", category: "Core Systems" },
  { slug: "dynamics-365", name: "Microsoft Dynamics 365", domain: "microsoft.com", category: "Core Systems" },
  { slug: "netsuite", name: "NetSuite", domain: "netsuite.com", category: "Core Systems" },

  // Email & Docs
  {
    slug: "gmail",
    name: "Gmail",
    domain: "gmail.com",
    category: "Email & Docs",
    logo: "https://ssl.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png",
  },
  { slug: "outlook", name: "Outlook", domain: "outlook.com", category: "Email & Docs" },
  {
    slug: "google-drive",
    name: "Google Drive",
    domain: "drive.google.com",
    category: "Email & Docs",
    logo: "https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png",
  },
  { slug: "sharepoint", name: "SharePoint", domain: "microsoft.com", category: "Email & Docs" },
  { slug: "dropbox", name: "Dropbox", domain: "dropbox.com", category: "Email & Docs" },

  // Collaboration
  { slug: "slack", name: "Slack", domain: "slack.com", category: "Collaboration" },
  { slug: "teams", name: "Microsoft Teams", domain: "microsoft.com", category: "Collaboration" },
  {
    slug: "google-calendar",
    name: "Google Calendar",
    domain: "calendar.google.com",
    category: "Collaboration",
    logo: "https://ssl.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png",
  },

  // Forms & Sheets
  {
    slug: "google-forms",
    name: "Google Forms",
    domain: "docs.google.com",
    category: "Forms & Sheets",
    logo: "https://ssl.gstatic.com/docs/forms/device_home/android_192.png",
  },
  { slug: "typeform", name: "Typeform", domain: "typeform.com", category: "Forms & Sheets" },
  {
    slug: "google-sheets",
    name: "Google Sheets",
    domain: "sheets.google.com",
    category: "Forms & Sheets",
    logo: "https://ssl.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png",
  },
  { slug: "docusign", name: "DocuSign", domain: "docusign.com", category: "Forms & Sheets" },
];

// ---------------- Photography ----------------

// Insurance/office/finance stock photos (Unsplash). Each <SectionPhoto> degrades
// to a warm brand gradient + icon if the image can't load, so the layout never breaks.
const PHOTOS = {
  office: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1600&q=80",
  advisor: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80",
  agreement: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
  analytics: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
  support: "https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=1200&q=80",
  protection: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80",
  team: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  documents: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
} as const;

function SectionPhoto({
  src,
  icon: Icon = Shield,
  className,
  imgClassName,
}: {
  src: string;
  icon?: LucideIcon;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)}>
      {!failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      ) : (
        <div className="brand-gradient grid h-full w-full place-items-center">
          <Icon className="h-10 w-10 text-primary-foreground/70" />
        </div>
      )}
    </div>
  );
}

// ---------------- Page ----------------

function Index() {
  // The landing page owns its own theme state (light/dark) via the shared
  // ThemeProvider, so the toggle in the nav can switch the whole marketing page.
  return (
    <ThemeProvider>
      <IndexContent />
    </ThemeProvider>
  );
}

function IndexContent() {
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const onAuthenticated = () => {
    // The app is scoped to insurance.
    setStoredIndustry("insurance");
    navigate({ to: "/app" });
  };

  const onBookDemo = () => navigate({ to: "/demo" });

  return (
    <div
      className={cn(
        "landing-root min-h-screen bg-background text-foreground",
        theme === "dark" && "dark",
      )}
    >
      <Nav onLogin={() => setAuthOpen(true)} onBookDemo={onBookDemo} />
      <Hero onBookDemo={onBookDemo} />
      <SocialProof />
      <ControlTowerSection />
      <WhyUs />
      <TrustBand />
      <FlowDiagram />
      <LandingWorkflows />
      <AboutSection onBookDemo={onBookDemo} />
      <IntegrationCatalog />
      <CopilotLibrary />
      <CoreDiagram />
      <FaqSection />
      <CTASection onBookDemo={onBookDemo} />
      <Footer />
      {authOpen && (
        <AuthModal onClose={() => setAuthOpen(false)} onAuthenticated={onAuthenticated} />
      )}
    </div>
  );
}

// ---------------- Scroll-reveal wrapper ----------------

// Wraps children in a scroll-triggered reveal. `pop` uses a slight scale-in.
function Reveal({
  children,
  className,
  delay = 0,
  pop = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  pop?: boolean;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(pop ? "reveal-pop" : "reveal", inView && "in-view", className)}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

// ---------------- Wired data-flow diagram ----------------

type FlowNode = {
  id: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  y: number;
  accent: string;
};

const FLOW_SOURCES: FlowNode[] = [
  { id: "inbox", label: "Email", sub: "Applications & claims", icon: Mail, y: 26, accent: "#3b82f6" },
  { id: "erp", label: "Core System", sub: "Salesforce · NetSuite", icon: Database, y: 104, accent: "#6366f1" },
  { id: "forms", label: "Forms", sub: "Customer onboarding", icon: ClipboardList, y: 182, accent: "#06b6d4" },
  { id: "docs", label: "Claim Docs", sub: "Forms, medical reports", icon: FileText, y: 260, accent: "#f59e0b" },
];

const FLOW_OUTPUTS: FlowNode[] = [
  { id: "erpwrite", label: "Policy Updates", sub: "Policies & claims", icon: FileCheck2, y: 26, accent: "#10b981" },
  { id: "sheets", label: "Google Sheets", sub: "Fallback records", icon: Table2, y: 104, accent: "#22c55e" },
  { id: "alerts", label: "Slack Alerts", sub: "Claims & risk", icon: Bell, y: 182, accent: "#a855f7" },
  { id: "approvals", label: "Approvals", sub: "Human sign-off", icon: BadgeCheck, y: 260, accent: "#0ea5e9" },
];

const FLOW_DETAIL: Record<string, string> = {
  inbox: "Policy applications and claims land in your inbox and are read, verified, and matched automatically.",
  erp: "Live policy, claim, and customer data is pulled from Salesforce or your policy admin system — no CSV exports.",
  forms: "Customer onboarding and KYC submissions are captured and verified automatically.",
  docs: "Claim forms, medical reports, and invoices are turned into structured data with confidence scores.",
  core: "The insurance core reads every document, verifies customers, coverage, and claims, applies your rules, and drafts each action — nothing is written back without approval.",
  erpwrite: "Approved policies, customers, and claim records are written straight back to Salesforce or your policy admin system.",
  sheets: "When no core connector is available, records are stored in Google Sheets — the same workflow, no change to the logic.",
  alerts: "Delays, exceptions, and fraud alerts are pushed to the right claims and risk channels.",
  approvals: "Every drafted action routes to the right approver before it touches your systems of record.",
};

const FLOW_W = 900;
const CARD_W = 168;
const CARD_H = 56;
const CORE = { left: 366, top: 132, w: 168, h: 96 };

function FlowDiagram() {
  const [active, setActive] = useState<string | null>(null);
  const { ref, inView } = useInView<HTMLDivElement>();

  const srcRightX = 24 + CARD_W;
  const coreLeftX = CORE.left;
  const coreRightX = CORE.left + CORE.w;
  const outLeftX = FLOW_W - 24 - CARD_W;
  const coreCY = CORE.top + CORE.h / 2;

  const wireIn = (n: FlowNode) => {
    const y1 = n.y + CARD_H / 2;
    const dx = (coreLeftX - srcRightX) / 2;
    return `M ${srcRightX} ${y1} C ${srcRightX + dx} ${y1}, ${coreLeftX - dx} ${coreCY}, ${coreLeftX} ${coreCY}`;
  };
  const wireOut = (n: FlowNode) => {
    const y2 = n.y + CARD_H / 2;
    const dx = (outLeftX - coreRightX) / 2;
    return `M ${coreRightX} ${coreCY} C ${coreRightX + dx} ${coreCY}, ${outLeftX - dx} ${y2}, ${outLeftX} ${y2}`;
  };

  const isActive = (side: "in" | "out", id: string) =>
    active === null || active === "core" || active === id
      ? true
      : side === "in"
        ? FLOW_SOURCES.some((s) => s.id === active)
          ? active === id
          : false
        : FLOW_OUTPUTS.some((o) => o.id === active)
          ? active === id
          : false;

  return (
    <section className="relative border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto mb-8 flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            The data flow
          </span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Your systems in. Reviewed, approved actions out.
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Every source connects into one insurance core that reads, validates, and drafts — then
            writes approved records back. Tap any node to see what it does.
          </p>
        </Reveal>

        <Reveal pop className="flex justify-center">
          <div className="no-scrollbar relative w-fit max-w-full overflow-x-auto rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2/60 p-4 shadow-sm md:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
            />
            <div
              ref={ref}
              className="grid-bg relative mx-auto rounded-xl"
              style={{ width: FLOW_W, height: CORE.top + CORE.h + 96 }}
            >
              {/* column captions */}
              <div className="absolute left-6 top-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Sources
              </div>
              <div
                className="absolute font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                style={{ left: CORE.left, width: CORE.w, textAlign: "center", top: 0 }}
              >
                AI Core
              </div>
              <div
                className="absolute font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                style={{ right: 24, top: 0 }}
              >
                Outputs
              </div>

              {/* wires */}
              <svg
                className="absolute inset-0"
                width={FLOW_W}
                height={CORE.top + CORE.h + 96}
                fill="none"
              >
                {FLOW_SOURCES.map((s) => {
                  const on = isActive("in", s.id);
                  return (
                    <path
                      key={`in-${s.id}`}
                      d={wireIn(s)}
                      className={cn(
                        on ? "stroke-primary" : "stroke-border",
                        inView && on && "wire-flow",
                      )}
                      strokeWidth={on ? 2 : 1.25}
                      strokeOpacity={on ? 0.9 : 0.5}
                    />
                  );
                })}
                {FLOW_OUTPUTS.map((o) => {
                  const on = isActive("out", o.id);
                  return (
                    <path
                      key={`out-${o.id}`}
                      d={wireOut(o)}
                      className={cn(
                        on ? "stroke-primary" : "stroke-border",
                        inView && on && "wire-flow",
                      )}
                      strokeWidth={on ? 2 : 1.25}
                      strokeOpacity={on ? 0.9 : 0.5}
                    />
                  );
                })}
              </svg>

              {/* source nodes */}
              {FLOW_SOURCES.map((n) => (
                <FlowCard
                  key={n.id}
                  node={n}
                  left={24}
                  active={active === n.id}
                  onClick={() => setActive((c) => (c === n.id ? null : n.id))}
                />
              ))}

              {/* core */}
              <button
                type="button"
                onClick={() => setActive((c) => (c === "core" ? null : "core"))}
                style={{ left: CORE.left, top: CORE.top, width: CORE.w, height: CORE.h }}
                className={cn(
                  "brand-gradient absolute grid place-items-center rounded-2xl text-primary-foreground shadow-xl shadow-primary/40 ring-1 ring-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                  active === "core"
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "core-pulse",
                )}
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                  <Cpu className="h-5 w-5" />
                </span>
                <span className="mt-1.5 text-sm font-semibold">Insurance Core</span>
                <span className="text-[10px] opacity-80">read · validate · draft</span>
              </button>

              {/* output nodes */}
              {FLOW_OUTPUTS.map((n) => (
                <FlowCard
                  key={n.id}
                  node={n}
                  left={outLeftX}
                  active={active === n.id}
                  onClick={() => setActive((c) => (c === n.id ? null : n.id))}
                />
              ))}
            </div>
          </div>
        </Reveal>

        {/* detail caption */}
        <div className="mx-auto mt-4 flex min-h-[2.5rem] max-w-3xl items-center justify-center rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-center text-sm text-muted-foreground">
          {active ? (
            <span className="text-foreground/90">{FLOW_DETAIL[active]}</span>
          ) : (
            <span>Tap a source, the core, or an output to trace what happens at each step.</span>
          )}
        </div>
      </div>
    </section>
  );
}

function FlowCard({
  node,
  left,
  active,
  onClick,
}: {
  node: FlowNode;
  left: number;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = node.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        left,
        top: node.y,
        width: CARD_W,
        height: CARD_H,
        borderColor: active ? node.accent : undefined,
        boxShadow: active ? `0 0 0 1px ${node.accent}, 0 8px 24px -10px ${node.accent}` : undefined,
      }}
      className={cn(
        "group absolute flex items-center gap-3 overflow-hidden rounded-xl border bg-card px-3 text-left shadow-sm transition focus:outline-none",
        !active && "border-border hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      {/* accent rail */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 rounded-l-xl"
        style={{ backgroundColor: node.accent, opacity: active ? 1 : 0.5 }}
      />
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg transition group-hover:scale-105"
        style={{ backgroundColor: `${node.accent}1f`, color: node.accent }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">{node.label}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{node.sub}</span>
      </span>
    </button>
  );
}

// ---------------- Why us ----------------

const WHY_US: { icon: LucideIcon; title: string; desc: string; featured?: boolean }[] = [
  {
    icon: ShieldCheck,
    title: "Built for Insurance",
    desc: "Purpose-built for how underwriting, claims, and broker teams work — policies, claims, and coverage baked into every workflow.",
  },
  {
    icon: Cpu,
    title: "AI at the Core",
    desc: "Copilots automate document-driven insurance busywork using Eagle Doc document intelligence and the Insurance AI Engine.",
    featured: true,
  },
  {
    icon: Plug,
    title: "Connector-First",
    desc: "Runs on the enterprise systems you already use — policy admin, email, storage, forms, and Slack — through one secure connection.",
  },
  {
    icon: Gauge,
    title: "Accuracy & Validation",
    desc: "Every extracted field is traceable to its source document and human-reviewed, so nothing questionable reaches your core system.",
  },
  {
    icon: Lock,
    title: "Confidentiality & Security",
    desc: "Your policyholder data stays protected and every action is logged — so you can prove who did what, and when.",
  },
  {
    icon: LifeBuoy,
    title: "Support When You Need It",
    desc: "Reach our team over email, Slack, and Microsoft Teams — plus docs and in-app help.",
  },
];

function WhyUs() {
  return (
    <section id="why-us" className="relative overflow-hidden border-b border-border/60 py-20">
      <FinanceGlyphs />
      <div className="relative mx-auto max-w-7xl px-5">
        <Reveal className="mb-12 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">Why us</span>
          <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Why insurance teams choose us
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Deep insurance expertise, modern automation, and the connectors your business already
            runs on — under one roof.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_US.map((w, i) => {
            const Icon = w.icon;
            return (
              <Reveal key={w.title} pop delay={(i % 3) * 90}>
                <div
                  className={cn(
                    "flex h-full flex-col rounded-2xl border p-6 transition duration-300 hover:-translate-y-1",
                    w.featured
                      ? "brand-gradient border-transparent text-primary-foreground shadow-lg shadow-primary/30"
                      : "border-border bg-surface hover:border-primary/40 hover:shadow-md",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-xl",
                      w.featured
                        ? "bg-white/15 text-primary-foreground"
                        : "bg-primary/10 text-primary ring-1 ring-primary/15",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{w.title}</h3>
                  <p
                    className={cn(
                      "mt-1.5 text-sm leading-relaxed",
                      w.featured ? "text-primary-foreground/85" : "text-muted-foreground",
                    )}
                  >
                    {w.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------- Our services (teal band) ----------------

const SERVICES: { icon: LucideIcon; title: string; points: string[] }[] = [
  { icon: FileText, title: "Policy Underwriting", points: ["Application extraction", "KYC & coverage validation", "AI risk scoring"] },
  { icon: Umbrella, title: "Claims Processing", points: ["Settlement time prediction", "Delay & exception detection", "Claims-policy matching"] },
  { icon: Users, title: "Customer Onboarding", points: ["Document validation", "Duplicate customer checks", "AI risk assessment"] },
  { icon: Scale, title: "Premium Reconciliation", points: ["Premium matching", "Variance detection", "Finance approval"] },
  { icon: AlertTriangle, title: "Portfolio Risk", points: ["Concentration detection", "Loss trend monitoring", "Reinsurance recommendations"] },
  { icon: BarChart3, title: "Executive Reporting", points: ["Loss ratio & claims KPIs", "Underwriting trends", "Premium & fraud analysis"] },
];

function ServicesBand() {
  return (
    <section id="services" className="relative overflow-hidden brand-gradient py-20 text-primary-foreground">
      <FinanceGlyphs onTeal />
      <div className="relative mx-auto max-w-7xl px-5">
        <Reveal className="mb-10 flex flex-col items-center gap-2 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary-foreground/80">
            Coverage
          </span>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            One platform for every insurance workflow
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.title} pop delay={(i % 3) * 90}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 text-foreground shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="#copilots"
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-6 py-3 text-sm font-semibold text-primary shadow-sm transition hover:-translate-y-0.5"
          >
            View all copilots
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ---------------- About ----------------

const ABOUT_POINTS = [
  "Purpose-built for MGAs and assistant underwriters triaging new submissions — not a generic platform",
  "Runs on the tools you already use — Gmail, Outlook, Salesforce, Google Drive — through one secure connection",
  "The AI prepares; your underwriter decides: proceed, request more information, or decline",
];

function AboutSection({ onBookDemo }: { onBookDemo: () => void }) {
  return (
    <section id="about" className="border-b border-border/60 py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2">
        {/* Copy */}
        <Reveal>
          <span className="font-mono text-xs uppercase tracking-wider text-primary">About us</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Built for MGAs and their underwriters
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Our copilot reads every broker submission — ACORD applications, loss runs, and financial
            statements — extracts and validates the data, applies your appetite rules, and drafts a
            recommendation. It runs on the enterprise tools you already use through one secure connection,
            with a human underwriter approving every decision and a full audit trail on each action.
          </p>
          <ul className="mt-5 space-y-2.5">
            {ABOUT_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-foreground/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
          <button
            onClick={onBookDemo}
            className="brand-gradient mt-7 inline-flex items-center gap-1.5 rounded-lg px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:-translate-y-0.5"
          >
            Read more
            <ArrowRight className="h-4 w-4" />
          </button>
        </Reveal>

        {/* Framed visual (teal L-brackets, like the reference) */}
        <Reveal pop className="relative mx-auto w-full max-w-md">
          <span
            aria-hidden
            className="absolute -right-3 -top-3 h-24 w-24 rounded-tr-2xl border-r-2 border-t-2 border-primary"
          />
          <span
            aria-hidden
            className="absolute -bottom-3 -left-3 h-24 w-24 rounded-bl-2xl border-b-2 border-l-2 border-primary"
          />
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="grid-bg flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="brand-gradient grid h-7 w-7 place-items-center rounded-md text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">This week at a glance</span>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
                On track
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5">
              {[
                { k: "Submissions triaged", v: "142", s: "+18% WoW" },
                { k: "Avg triage time", v: "7.4 min", s: "−23 min" },
                { k: "AI rec. accepted", v: "89%", s: "+4 pts" },
                { k: "Sent to senior UW", v: "64", s: "this week" },
              ].map((m) => (
                <div key={m.k} className="rounded-xl border border-border bg-card p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{m.k}</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">{m.v}</div>
                  <div className="text-[11px] font-medium text-emerald-500">{m.s}</div>
                </div>
              ))}
            </div>
            <p className="px-5 pb-4 text-[10px] text-muted-foreground/70">
              Illustrative — sample data, not live customer usage.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------- Workflows (same as the in-app Workflows page) ----------------

type WfStepKind = "trigger" | "extract" | "match" | "validate" | "approve" | "output";
type WfStep = { label: string; system: string; kind: WfStepKind };
type LandingWf = { id: string; name: string; flow: WfStep[] };

const WF_KIND: Record<WfStepKind, { label: string; dot: string; ring: string; text: string }> = {
  trigger: { label: "Trigger", dot: "bg-amber-400", ring: "border-amber-400/50", text: "text-amber-400" },
  extract: { label: "Extract", dot: "bg-sky-400", ring: "border-sky-400/50", text: "text-sky-400" },
  match: { label: "Match", dot: "bg-cyan-400", ring: "border-cyan-400/50", text: "text-cyan-400" },
  validate: { label: "Validate", dot: "bg-violet-400", ring: "border-violet-400/50", text: "text-violet-400" },
  approve: { label: "Approve", dot: "bg-indigo-400", ring: "border-indigo-400/50", text: "text-indigo-400" },
  output: { label: "Output", dot: "bg-emerald-400", ring: "border-emerald-400/50", text: "text-emerald-400" },
};

const LANDING_WORKFLOWS: LandingWf[] = [
  {
    id: "wf_underwriting_triage",
    name: "Underwriting Triage",
    flow: [
      { label: "Broker sends submission", system: "Gmail", kind: "trigger" },
      { label: "Extract ACORD, loss runs, financials", system: "Eagle Doc", kind: "extract" },
      { label: "Cross-document validation", system: "AI Engine", kind: "match" },
      { label: "Apply appetite rules", system: "Rules Engine", kind: "validate" },
      { label: "Underwriter review", system: "Approvals", kind: "approve" },
      { label: "Broker response", system: "Gmail", kind: "output" },
    ],
  },
  {
    id: "wf_claims_processing",
    name: "Claims Processing",
    flow: [
      { label: "Claim submitted", system: "Salesforce", kind: "trigger" },
      { label: "Retrieve claim data", system: "Salesforce", kind: "extract" },
      { label: "Predict settlement time", system: "AI Engine", kind: "match" },
      { label: "Delay + exception detection", system: "AI Engine", kind: "validate" },
      { label: "Notify customer", system: "Gmail", kind: "output" },
      { label: "Notify claims team", system: "Slack", kind: "output" },
    ],
  },
  {
    id: "wf_customer_onboard",
    name: "Customer Onboarding & KYC",
    flow: [
      { label: "Onboarding submitted", system: "Google Forms", kind: "trigger" },
      { label: "Extract documents", system: "Eagle Doc", kind: "extract" },
      { label: "Verify identity + financials", system: "AI Engine", kind: "validate" },
      { label: "Duplicate customer check", system: "Salesforce", kind: "match" },
      { label: "Approval", system: "Approvals", kind: "approve" },
      { label: "Create customer", system: "Salesforce", kind: "output" },
    ],
  },
  {
    id: "wf_fraud_detection",
    name: "Fraud Detection",
    flow: [
      { label: "Claim update", system: "Salesforce", kind: "trigger" },
      { label: "Detect anomaly / fraud", system: "AI Engine", kind: "extract" },
      { label: "Classify by severity", system: "AI Engine", kind: "validate" },
      { label: "Claims approval", system: "Approvals", kind: "approve" },
      { label: "Notify customer", system: "Gmail", kind: "output" },
      { label: "Update case", system: "Salesforce", kind: "output" },
    ],
  },
  {
    id: "wf_premium_recon",
    name: "Premium Reconciliation",
    flow: [
      { label: "Payment received", system: "Gmail", kind: "trigger" },
      { label: "Extract payment", system: "Eagle Doc", kind: "extract" },
      { label: "Retrieve policy + schedule", system: "Salesforce", kind: "match" },
      { label: "Detect variance", system: "AI Engine", kind: "validate" },
      { label: "Finance approval", system: "Approvals", kind: "approve" },
      { label: "Update core system", system: "Salesforce", kind: "output" },
    ],
  },
  {
    id: "wf_portfolio_risk",
    name: "Portfolio Risk Monitoring",
    flow: [
      { label: "Scheduled trigger", system: "Scheduler", kind: "trigger" },
      { label: "Retrieve portfolio", system: "Salesforce", kind: "extract" },
      { label: "Concentration detection", system: "AI Engine", kind: "match" },
      { label: "Reinsurance recommendations", system: "AI Engine", kind: "validate" },
      { label: "Slack alert", system: "Slack", kind: "output" },
      { label: "Repricing recommendation", system: "Gmail", kind: "output" },
    ],
  },
  {
    id: "wf_claims_doc",
    name: "Claims Document",
    flow: [
      { label: "Document uploaded", system: "Google Drive", kind: "trigger" },
      { label: "Extract claim form", system: "Eagle Doc", kind: "extract" },
      { label: "Validate invoice", system: "AI Engine", kind: "validate" },
      { label: "Store metadata", system: "Google Sheets", kind: "output" },
      { label: "Notify claims team", system: "Slack", kind: "output" },
    ],
  },
  {
    id: "wf_exec_report",
    name: "Insurance Executive Reporting",
    flow: [
      { label: "Scheduled trigger", system: "Scheduler", kind: "trigger" },
      { label: "Retrieve operational data", system: "Salesforce", kind: "extract" },
      { label: "Compile KPIs", system: "AI Engine", kind: "match" },
      { label: "AI executive summary", system: "AI Engine", kind: "validate" },
      { label: "Store report", system: "Google Drive", kind: "output" },
      { label: "Email leadership", system: "Gmail", kind: "output" },
    ],
  },
];

// Flow-graph geometry (mirrors the in-app Workflows page).
const WF_STEP_W = 138;
const WF_STEP_H = 52;
const WF_SYS_W = 116;
const WF_SYS_H = 36;
const WF_STEP_Y = 88;
const WF_SYS_Y = 258;
const WF_PAD = 24;
const WF_STEP_GAP = 168;

function LandingWorkflows() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = LANDING_WORKFLOWS.find((w) => w.id === activeId) ?? null;

  return (
    <section id="workflow" className="border-b border-border/60 bg-surface-2/40 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">Workflows</span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Watch a workflow run end to end
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            The same workflows that run inside the app. Pick one to trace every step and the systems
            it connects.
          </p>
        </Reveal>

        {/* Compact workflow boxes — click one to open its flow in a popup */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_WORKFLOWS.map((w) => {
            const systems = new Set(w.flow.map((s) => s.system)).size;
            return (
              <Reveal key={w.id} pop>
                <button
                  onClick={() => setActiveId(w.id)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Workflow className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">{w.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {w.flow.length} steps · {systems} systems
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      {active && <WorkflowModal wf={active} onClose={() => setActiveId(null)} />}
    </section>
  );
}

function WorkflowModal({ wf, onClose }: { wf: LandingWf; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${wf.name} workflow`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="nice-scroll max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="brand-gradient grid h-8 w-8 place-items-center rounded-lg text-primary-foreground shadow-sm shadow-primary/25">
              <Workflow className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold tracking-tight">{wf.name}</h3>
              <p className="font-mono text-[11px] text-muted-foreground">{wf.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Flow */}
        <div className="nice-scroll overflow-x-auto p-6">
          <LandingWorkflowGraph flow={wf.flow} />
        </div>
      </div>
    </div>
  );
}

function LandingWorkflowGraph({ flow }: { flow: WfStep[] }) {
  const stepX = flow.map((_, i) => WF_PAD + WF_STEP_W / 2 + i * WF_STEP_GAP);
  const canvasW = WF_PAD * 2 + WF_STEP_W + (flow.length - 1) * WF_STEP_GAP;
  const systems = Array.from(new Set(flow.map((s) => s.system)));
  const sysX = (name: string) => {
    const i = systems.indexOf(name);
    if (systems.length === 1) return canvasW / 2;
    const usable = canvasW - WF_PAD * 2 - WF_SYS_W;
    return WF_PAD + WF_SYS_W / 2 + (i * usable) / (systems.length - 1);
  };
  const seqPath = (i: number) => {
    const x1 = stepX[i] + WF_STEP_W / 2;
    const x2 = stepX[i + 1] - WF_STEP_W / 2;
    const dx = (x2 - x1) / 2;
    return `M ${x1} ${WF_STEP_Y} C ${x1 + dx} ${WF_STEP_Y}, ${x2 - dx} ${WF_STEP_Y}, ${x2} ${WF_STEP_Y}`;
  };
  const downPath = (i: number, name: string) => {
    const x1 = stepX[i];
    const y1 = WF_STEP_Y + WF_STEP_H / 2;
    const x2 = sysX(name);
    const y2 = WF_SYS_Y - WF_SYS_H / 2;
    const dy = (y2 - y1) / 2;
    return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
  };
  const CANVAS_H = WF_SYS_Y + WF_SYS_H / 2 + 28;

  return (
    <div className="mx-auto" style={{ width: canvasW }}>
      <div className="relative" style={{ width: canvasW, height: CANVAS_H + 24 }}>
        <div className="absolute left-0 top-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Flow
        </div>
        <div
          className="absolute left-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
          style={{ top: WF_SYS_Y - WF_SYS_H / 2 - 42 }}
        >
          Connectors
        </div>

        <svg className="absolute inset-0" width={canvasW} height={CANVAS_H + 24} fill="none">
          {flow.slice(0, -1).map((_, i) => (
            <path key={`seq-${i}`} d={seqPath(i)} className="stroke-primary/70" strokeWidth={1.75} />
          ))}
          {flow.map((s, i) => (
            <path key={`down-${i}`} d={downPath(i, s.system)} className="stroke-primary/25" strokeWidth={1.25} />
          ))}
        </svg>

        {flow.map((s, i) => {
          const meta = WF_KIND[s.kind];
          return (
            <div
              key={`step-${i}`}
              style={{ left: stepX[i] - WF_STEP_W / 2, top: WF_STEP_Y - WF_STEP_H / 2, width: WF_STEP_W, height: WF_STEP_H }}
              className={cn("absolute flex flex-col justify-center rounded-md border bg-card px-2.5 shadow-sm", meta.ring)}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-semibold text-background", meta.dot)}>
                  {i + 1}
                </span>
                <span className="truncate text-[11px] font-semibold text-foreground">{s.label}</span>
              </div>
              <span className={cn("mt-0.5 pl-[22px] text-[9px] font-medium uppercase tracking-wide", meta.text)}>
                {meta.label}
              </span>
            </div>
          );
        })}

        {systems.map((name) => (
          <div
            key={`sys-${name}`}
            style={{ left: sysX(name) - WF_SYS_W / 2, top: WF_SYS_Y - WF_SYS_H / 2, width: WF_SYS_W, height: WF_SYS_H }}
            className="absolute flex items-center gap-1.5 rounded-md border border-orange-400/50 bg-card px-2.5 shadow-sm"
          >
            <Plug className="h-3 w-3 shrink-0 text-orange-400" />
            <span className="truncate text-[11px] font-medium text-foreground">{name}</span>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {(Object.keys(WF_KIND) as WfStepKind[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", WF_KIND[k].dot)} />
            {WF_KIND[k].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          Connector
        </span>
      </div>
    </div>
  );
}

// ---------------- Nav ----------------

function Nav({ onLogin, onBookDemo }: { onLogin: () => void; onBookDemo: () => void }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <a href="#" className="flex items-center">
          <LogoLockup className="ml-2" />
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#why-us" className="transition hover:text-foreground">
            Why us
          </a>
          <a href="#services" className="transition hover:text-foreground">
            Services
          </a>
          <a href="#about" className="transition hover:text-foreground">
            About
          </a>
          <a href="#copilots" className="transition hover:text-foreground">
            Copilots
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={onLogin}
            className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            Log in
          </button>
          <button
            onClick={onBookDemo}
            className="brand-gradient rounded-lg px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition hover:opacity-90"
          >
            Book a demo
          </button>
        </div>
      </div>
    </header>
  );
}

// ---------------- Hero ----------------

// Decorative insurance motifs — faint shields, umbrellas, documents, and policy
// icons that sit behind a section's content (pointer-events-none) to give an
// insurance identity without affecting layout. Set `onTeal` for a brand-gradient background.
function FinanceGlyphs({ onTeal = false }: { onTeal?: boolean }) {
  const tone = onTeal ? "text-primary-foreground/10" : "text-primary/[0.07]";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Shield className={cn("absolute left-[4%] top-[20%] h-16 w-16 -rotate-6", tone)} />
      <Umbrella className={cn("absolute right-[7%] top-[16%] h-14 w-14", tone)} />
      <FileText className={cn("absolute left-[13%] bottom-[16%] h-12 w-12", tone)} />
      <HeartPulse className={cn("absolute right-[15%] bottom-[26%] h-9 w-9", tone)} />
      <Landmark className={cn("absolute left-[46%] top-[12%] h-12 w-12", tone)} />
      <Globe className={cn("absolute right-[40%] bottom-[14%] h-12 w-12", tone)} />
      <ArrowLeftRight className={cn("absolute left-[28%] bottom-[34%] h-9 w-9", tone)} />
    </div>
  );
}

// A faint upward "market line" chart, drawn edge-to-edge along the bottom of a section.
function MarketLine({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full", className)}
      viewBox="0 0 1200 160"
      preserveAspectRatio="none"
      fill="none"
    >
      <polyline
        points="0,120 90,104 180,112 270,74 360,92 450,54 540,68 630,34 720,58 810,28 900,44 990,18 1080,36 1200,14"
        stroke="currentColor"
        strokeWidth="2"
      />
      <polyline
        points="0,140 90,132 180,136 270,116 360,124 450,104 540,112 630,92 720,104 810,86 900,96 990,78 1080,90 1200,72"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
        strokeDasharray="4 5"
      />
    </svg>
  );
}

const HERO_TRUST: { icon: LucideIcon; label: string }[] = [
  { icon: Landmark, label: "Works with Salesforce, NetSuite & Google Sheets" },
  { icon: ShieldCheck, label: "Human approval before anything is written back" },
  { icon: ScrollText, label: "Full audit trail on every action" },
];

function Hero({ onBookDemo }: { onBookDemo: () => void }) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Decorative layer is clipped on its own so it never overflows the section. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Full-section background image — auto-switches with the active theme. */}
        <img
          src="/Background-light.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top dark:hidden"
        />
        <img
          src="/Background-dark.png"
          alt=""
          className="absolute inset-0 hidden h-full w-full object-cover object-top dark:block"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-background/40 to-background dark:from-background/35 dark:via-background/45 dark:to-background" />
        {/* mask the baked-in marketing strip at the image bottom */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute -top-44 left-1/2 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -top-10 right-0 h-80 w-80 rounded-full bg-primary-2/20 blur-3xl" />
        {/* faint insurance motifs — left side, clear of the product card */}
        <Shield className="absolute left-[3%] top-[20%] h-10 w-10 text-primary/[0.08]" />
        <Umbrella className="absolute left-[16%] top-[12%] hidden h-12 w-12 text-primary/[0.07] lg:block" />
        <FileCheck2 className="absolute bottom-[24%] left-[6%] h-14 w-14 -rotate-6 text-primary/[0.07]" />
        <HeartPulse className="absolute bottom-[16%] left-[24%] hidden h-8 w-8 text-primary/[0.08] lg:block" />
        <MarketLine className="text-primary/[0.08]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Left — copy */}
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Built for underwriting, claims & broker teams
            </div>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              {HERO.tagline}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              {HERO.sub}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onBookDemo}
                className="brand-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:opacity-95"
              >
                Book a demo
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#copilots"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                See the copilots
              </a>
            </div>

            {/* trust chips */}
            <div className="mt-8 flex flex-wrap gap-2">
              {HERO_TRUST.map((t) => {
                const Icon = t.icon;
                return (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {t.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Right — photographic hero visual */}
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

// A framed photographic hero visual with floating stat chips — fills the hero's
// right column with real insurance imagery instead of a product card.
function HeroVisual() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[32px] bg-primary/10 blur-2xl"
      />
      <div className="relative">
        <SectionPhoto
          src={PHOTOS.office}
          icon={Shield}
          className="aspect-[4/3] w-full rounded-3xl border border-border shadow-2xl"
        />
        {/* coverage chip */}
        <div className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/85 px-3 py-1.5 text-xs font-medium text-primary shadow-lg backdrop-blur">
          <Umbrella className="h-3.5 w-3.5" /> Life · Health · P&C
        </div>
      </div>
    </div>
  );
}

// A realistic insurance product preview — the operations touch: claims KPIs,
// a live claims processing list, and a drafted policy awaiting approval.
function HeroPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[28px] bg-primary/10 blur-2xl"
      />


      <div className="relative rounded-2xl border border-border bg-surface shadow-2xl">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md brand-gradient text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-semibold">Underwriting control tower</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" /> Sample data
          </span>
        </div>

        <div className="space-y-4 p-4">
          {/* KPI tiles */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Submissions today", value: "142", tone: "text-foreground" },
              { label: "AI acceptance", value: "89%", tone: "text-emerald-500" },
              { label: "Appetite flags", value: "12", tone: "text-amber-500" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {k.label}
                </div>
                <div className={cn("mt-1 text-lg font-semibold tabular-nums", k.tone)}>
                  {k.value}
                </div>
              </div>
            ))}
          </div>

          {/* Claims processing list */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Submission triage
              </span>
              <span className="text-[10px] text-muted-foreground">124 / 142 triaged</span>
            </div>
            <ul className="space-y-1.5">
              {[
                { d: "SUB-4471 · Property · Marsh", a: "Proceed", ok: true },
                { d: "SUB-4468 · Gen. Liability · Aon", a: "More info", ok: false },
                { d: "SUB-4462 · Cyber · Gallagher", a: "Declined", ok: false },
              ].map((r) => (
                <li key={r.d} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="flex min-w-0 items-center gap-2">
                    {r.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}
                    <span className="truncate font-mono text-muted-foreground">{r.d}</span>
                  </span>
                  <span className="shrink-0 font-mono tabular-nums text-foreground">{r.a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Drafted policy */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                Drafted recommendation · SUB-4471
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Needs review
              </span>
            </div>
            <table className="w-full text-[12px]">
              <tbody className="font-mono">
                <tr>
                  <td className="py-0.5 text-foreground/90">Property · Acme Corp</td>
                  <td className="py-0.5 text-right tabular-nums text-muted-foreground">$4.2M revenue</td>
                  <td className="py-0.5 text-right tabular-nums text-foreground">Recommend</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-foreground/90">Loss runs · 5 yrs</td>
                  <td className="py-0.5 text-right tabular-nums text-muted-foreground">no major losses</td>
                  <td className="py-0.5 text-right tabular-nums text-emerald-500">In appetite</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-foreground/90">Appetite check</td>
                  <td className="py-0.5 text-right tabular-nums text-muted-foreground">ACORD vs financials</td>
                  <td className="py-0.5 text-right tabular-nums text-amber-500">1 flag</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3 flex items-center gap-2">
              <button className="brand-gradient inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold text-primary-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve & send
              </button>
              <button className="rounded-md border border-border bg-surface px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                Review
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/70">
            Illustrative preview — sample data, not live customer usage.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------- Control tower section (houses the product preview) ----------------

const CONTROL_TOWER_POINTS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Umbrella,
    title: "Live submission triage",
    desc: "Every broker submission with a triage status and appetite check, flagged the moment it lands in the inbox.",
  },
  {
    icon: FileText,
    title: "Drafted, not decided",
    desc: "AI reads each ACORD form, loss run, and financial statement, applies your appetite, and drafts a recommendation — then waits for your underwriter.",
  },
  {
    icon: CheckCircle2,
    title: "One-click routing",
    desc: "Send to a senior underwriter, request more information, or decline — written back to your CRM, or Google Sheets, in a single click.",
  },
];

function ControlTowerSection() {
  return (
    <section className="border-b border-border/60 bg-surface-2/40 py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Copy */}
        <Reveal>
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Underwriting control tower
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Your whole submission pipeline on one screen.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Broker submissions, appetite flags, and every drafted recommendation — surfaced in real
            time, with a human underwriter in control of every decision before it touches your systems.
          </p>
          <ul className="mt-6 space-y-4">
            {CONTROL_TOWER_POINTS.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.title} className="flex gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{p.title}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">{p.desc}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>

        {/* Product preview card */}
        <Reveal pop>
          <HeroPreview />
        </Reveal>
      </div>
    </section>
  );
}

// ---------------- Trust band (photo-led) ----------------

const TRUST_POINTS = [
  "Connector-first — runs on the enterprise systems you already use",
  "AI extracts and validates; your team approves every action",
  "Works core-connected or core-independent, with the same workflow",
];

// ---------------- Social proof (design-partner program) ----------------
// NOTE: placeholder content for pre-launch. Replace the role-based descriptors and
// the testimonial with a real named pilot/MGA as soon as one is public.
const DESIGN_PARTNERS: string[] = [
  "Specialty MGA",
  "Regional carrier",
  "Wholesale broker",
  "Program administrator",
];

function SocialProof() {
  return (
    <section className="border-b border-border/60 bg-surface-2/40 py-16">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="flex flex-col items-center gap-3 text-center">
          <span className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-primary">
            Design partner program — now onboarding
          </span>
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight md:text-3xl">
            Being shaped with early insurance teams
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            We're building alongside a small group of design partners across underwriting and
            claims. Partner types below are illustrative of the program.
          </p>
        </Reveal>

        <Reveal pop className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {DESIGN_PARTNERS.map((p) => (
            <span
              key={p}
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted-foreground"
            >
              {p}
            </span>
          ))}
        </Reveal>

        <Reveal className="mx-auto mt-10 max-w-2xl rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-sm italic leading-relaxed text-foreground/90 md:text-base">
            &ldquo;The human-in-the-loop approvals and full audit trail are exactly what our
            compliance team needs before we automate any part of triage.&rdquo;
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Illustrative — design partner feedback, to be attributed on launch
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function TrustBand() {
  return (
    <section className="border-b border-border/60 py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Photo collage */}
        <Reveal pop className="order-2 lg:order-1">
          <div className="relative grid grid-cols-5 grid-rows-6 gap-3" style={{ minHeight: 380 }}>
            <SectionPhoto
              src={PHOTOS.team}
              icon={Umbrella}
              className="col-span-3 row-span-6 rounded-2xl border border-border shadow-lg"
            />
            <SectionPhoto
              src={PHOTOS.agreement}
              icon={FileText}
              className="col-span-2 row-span-3 rounded-2xl border border-border shadow-lg"
            />
            <SectionPhoto
              src={PHOTOS.support}
              icon={Landmark}
              className="col-span-2 row-span-3 rounded-2xl border border-border shadow-lg"
            />
          </div>
        </Reveal>

        {/* Copy */}
        <Reveal className="order-1 lg:order-2">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Built on trust &amp; reliability
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Settle claims faster, with fewer surprises.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            We simplify complex insurance operations by combining document intelligence, the
            Insurance AI Engine, and your existing connectors — so policies, claims, and premiums
            flow through automatically, and a human signs off before anything is written back.
          </p>
          <ul className="mt-6 space-y-3">
            {TRUST_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-foreground/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------- FAQ ----------------

const FAQS: { q: string; a: string }[] = [
  {
    q: "Does the AI act on its own?",
    a: "No. The AI reads documents, applies your rules, and drafts a recommendation — it never binds, declines, pays, or writes anything to your systems without a human approving it first. Every recommendation sits in a review queue until an underwriter, adjuster, or manager approves, edits, or overrides it. Nothing moves downstream — no policy update, no claim payment, no CRM write-back — without that sign-off, and every decision is logged with who approved it and when.",
  },
  {
    q: "What insurance workflows does the AI OS automate?",
    a: "Eight document-driven workflows out of the box: new policy underwriting, claims processing, customer onboarding & KYC, fraud detection, premium reconciliation, portfolio risk monitoring, claims document extraction, and executive reporting.",
  },
  {
    q: "Do I need a dedicated policy admin or claims system to use it?",
    a: "No. It runs on the tools you're already using — email, Salesforce, Google Drive, Sheets — so you can start without a PAS or claims-system integration in place. If you do have a system like Guidewire or Duck Creek connected, approved actions write back there directly; if not, records are kept in a connected fallback like Google Sheets so nothing is lost or untracked.",
  },
  {
    q: "What happens if my policy admin system isn't connected?",
    a: "Everything still works — the AI still reads submissions, applies your rules, and drafts recommendations. The only difference is where approved decisions get recorded: instead of writing back into a PAS or claims system, they're logged in a connected fallback (Google Sheets, by default) that your team can review, export, or later migrate into a PAS once one is connected.",
  },
  {
    q: "How does it read documents?",
    a: "It extracts structured data from whatever comes in — PDFs, scanned forms, Excel files, emails — using OCR and document classification tuned for insurance formats like ACORD applications and loss runs. Every extracted field is traceable back to the exact document and location it came from, so your team can verify anything the AI surfaces against the original source in one click. If a document is too degraded to read reliably (a bad scan, an illegible field), it's routed to a manual review queue instead of guessing — we'd rather flag \"we couldn't read this\" than produce a confident-looking wrong answer.",
  },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-b border-border/60 py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <span className="font-mono text-xs uppercase tracking-wider text-primary">FAQ</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Clear answers on connectors, approvals, and how the Insurance AI OS fits your stack.
          </p>
          <SectionPhoto
            src={PHOTOS.office}
            icon={Shield}
            className="mt-6 hidden h-48 rounded-2xl border border-border shadow-lg lg:block"
          />
        </Reveal>

        <Reveal pop className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className="overflow-hidden rounded-xl border border-border bg-surface transition hover:border-primary/40"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-foreground">{f.q}</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-primary transition",
                      isOpen && "rotate-90",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-200",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                      {f.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

// ---------------- Core diagram ----------------

type CoreCapability = {
  name: string;
  icon: LucideIcon;
  desc: string;
  detail: string;
  points: string[];
};

const CORE_CAPABILITIES: CoreCapability[] = [
  {
    name: "Eagle Doc",
    icon: FileText,
    desc: "OCR, classification, and structured extraction from any insurance document.",
    detail:
      "Turns any inbound document — applications, policies, claim forms, medical reports, invoices — into structured, ready-to-use data without manual keying. Every field comes with a confidence score, so low-confidence extractions are flagged for a human instead of processed blindly.",
    points: [
      "OCR for applications, policies, and claim documents",
      "Document classification and structured extraction",
      "Applicant, coverage, and loss parsing",
      "Confidence scoring with human review on exceptions",
    ],
  },
  {
    name: "Insurance AI Engine",
    icon: Cpu,
    desc: "KYC verification, claims analysis, risk insights, settlement prediction, and document validation.",
    detail:
      "The shared intelligence behind every workflow. It verifies customers, analyzes claims, predicts settlement times, surfaces portfolio risk insights, and validates documents — reusable across underwriting, claims, onboarding, and premium operations.",
    points: [
      "KYC verification and duplicate detection",
      "Claims analysis and settlement prediction",
      "Portfolio risk insights and reinsurance recommendations",
      "Document validation across every workflow",
    ],
  },
  {
    name: "Approval Engine",
    icon: ShieldCheck,
    desc: "Underwriting, finance, claims, and risk approvals before anything is written back.",
    detail:
      "Every action a copilot proposes runs through your approvals before it touches a system of record. Routing, thresholds, and role-based sign-off are enforced automatically for underwriting, finance, claims, and risk teams.",
    points: [
      "Configurable approval routing and thresholds",
      "Underwriting, finance, claims & risk approvals",
      "Role-based sign-off enforced by policy",
      "Human sign-off required before write-back",
    ],
  },
  {
    name: "Business Rules Engine",
    icon: Gauge,
    desc: "Duplicate detection, coverage validation, and policy enforcement on every document.",
    detail:
      "Applies your underwriting and claims rules to every document a copilot handles — catching duplicate applications, invalid coverage, and policy violations before they flow downstream into your core system.",
    points: [
      "Duplicate application and customer detection",
      "Coverage and premium validation",
      "Company and regulatory policy enforcement",
      "Configurable rules per workflow",
    ],
  },
  {
    name: "Connector Decision Layer",
    icon: Plug,
    desc: "Writes to your policy admin system when connected; otherwise stores records in Google Sheets.",
    detail:
      "Keeps every workflow unchanged regardless of the connected backend. When a core connector is available, approved records write straight to your CRM or ERP (Salesforce, HubSpot, NetSuite, Dynamics 365); when it isn't, the same records land in Google Sheets — no change to the AI logic or approvals.",
    points: [
      "Writes to Salesforce / policy admin when connected",
      "Falls back to Google Sheets automatically",
      "Same workflow logic regardless of backend",
      "Future-ready for claims, billing & carrier systems",
    ],
  },
  {
    name: "Reporting Engine",
    icon: BarChart3,
    desc: "KPI generation and executive summaries across claims, underwriting, and premium.",
    detail:
      "Turns your operational data into executive-ready reporting on demand. Loss ratios and underwriting performance, claims trends, and premium analysis are compiled and explained in plain language — ready for leadership to review.",
    points: [
      "Loss ratio and underwriting performance KPIs",
      "Claims trend and premium analysis",
      "AI-written executive summaries",
      "Leadership-ready exports",
    ],
  },
];

function CoreDiagram() {
  const [selected, setSelected] = useState<CoreCapability | null>(null);
  return (
    <section id="platform" className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            The insurance core
          </span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Every copilot runs on the same insurance operating system.
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Instead of rebuilding the basics for every task, each copilot inherits the same reusable
            building blocks — Eagle Doc, the Insurance AI Engine, the Approval Engine, business
            rules, the Connector Decision Layer, and reporting — already wired together and tuned for
            insurance. Click any block to see what it does.
          </p>
          <span className="mt-1 rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-muted-foreground">
            In active build with design partners across underwriting &amp; claims
          </span>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {CORE_CAPABILITIES.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => setSelected(s)}
                aria-label={`Learn more about ${s.name}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 transition group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <div className="text-base font-semibold md:text-[17px]">{s.name}</div>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {selected && <CoreModal capability={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function CoreModal({ capability, onClose }: { capability: CoreCapability; onClose: () => void }) {
  const Icon = capability.icon;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="core-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="nice-scroll max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div className="flex items-center gap-4">
            <span className="brand-gradient grid h-12 w-12 shrink-0 place-items-center rounded-xl text-primary-foreground shadow-md shadow-primary/25">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-primary">
                Insurance core
              </span>
              <h3 id="core-title" className="mt-0.5 text-xl font-semibold tracking-tight">
                {capability.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <p className="text-sm leading-relaxed text-foreground/90">{capability.detail}</p>
          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              What it does
            </div>
            <ul className="space-y-2">
              {capability.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm text-foreground/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <a
            href="#copilots"
            onClick={onClose}
            className="brand-gradient inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:opacity-95"
          >
            See the copilots that use it
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------- Workflow ----------------

// Adds an `in-view` class the first time the element scrolls into the viewport,
// so CSS-driven reveal/draw animations fire on scroll. No-op re-observes after.
function useInView<T extends HTMLElement>(rootMargin = "0px 0px -12% 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin, threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, inView };
}

function WorkflowSection({ content }: { content: WorkflowContent }) {
  const workflow = content;
  const heading = useInView<HTMLDivElement>();
  const before = useInView<HTMLDivElement>();
  const after = useInView<HTMLDivElement>();
  const timeline = useInView<HTMLDivElement>();

  return (
    <section
      id="workflow"
      className="relative overflow-hidden border-b border-border/60 bg-surface-2 py-20"
    >
      {/* soft ambient glow behind the section */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-5xl px-5">
        <div
          ref={heading.ref}
          className={cn(
            "reveal mb-12 flex flex-col items-center gap-3 text-center",
            heading.inView && "in-view",
          )}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 font-mono text-xs uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> How it works
          </span>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            {workflow.title}
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            The same six steps every time — AI does the work, your team stays in control.
          </p>
        </div>

        {/* Before → After contrast */}
        <div className="relative mb-16 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div
            ref={before.ref}
            className={cn(
              "reveal rounded-2xl border border-border bg-surface/40 p-6 transition duration-300 hover:-translate-y-1 hover:border-border/80",
              before.inView && "in-view",
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Before
              </span>
            </div>
            <p className="text-sm text-foreground/80">{workflow.before}</p>
          </div>
          <div className="flex items-center justify-center py-2 md:py-0">
            {/* dashed connector + arrow node */}
            <span
              aria-hidden
              className="absolute left-1/2 hidden h-px w-24 -translate-x-1/2 border-t border-dashed border-border md:block"
            />
            <div className="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-primary/40 bg-background text-primary shadow-[0_0_0_5px_var(--surface-2)]">
              <ArrowRight className="arrow-float h-5 w-5" />
            </div>
          </div>
          <div
            ref={after.ref}
            className={cn(
              "reveal rounded-2xl border border-primary/40 bg-primary/5 p-6 shadow-[0_0_30px_-8px_var(--primary)] transition duration-300 hover:-translate-y-1",
              after.inView && "in-view",
            )}
            style={{ transitionDelay: after.inView ? "120ms" : "0ms" }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                After
              </span>
            </div>
            <p className="text-sm text-foreground/90">{workflow.after}</p>
          </div>
        </div>

        {/* Connected step timeline */}
        <div ref={timeline.ref} className="relative">
          {/* far-left vertical rail + terminating arrow */}
          <span
            aria-hidden
            className={cn(
              "rail-draw absolute left-[19px] top-5 bottom-8 w-0.5 bg-gradient-to-b from-primary/50 via-border to-border",
              timeline.inView && "in-view",
            )}
          />

          <ol className="relative space-y-3">
            {workflow.steps.map((s, i) => {
              const Icon = STEP_ICONS[i] ?? Sparkles;
              return (
                <li key={s.label} className="relative flex items-center gap-3">
                  {/* numbered badge sitting on the rail */}
                  <div className="relative z-10 flex w-10 shrink-0 justify-center">
                    <span
                      className={cn(
                        "reveal grid h-8 w-8 place-items-center rounded-full border border-primary/50 bg-background text-xs font-semibold text-primary shadow-[0_0_0_4px_var(--surface-2),0_0_12px_-2px_var(--primary)]",
                        timeline.inView && "in-view",
                      )}
                      style={{ transitionDelay: `${i * 80}ms` }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  {/* connector dot */}
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                  {/* step card */}
                  <div
                    className={cn(
                      "reveal grid flex-1 grid-cols-1 overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-surface/70 to-surface-2/50 transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:grid-cols-[minmax(180px,240px)_1fr]",
                      timeline.inView && "in-view",
                    )}
                    style={{ transitionDelay: `${i * 80 + 60}ms` }}
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[15px] font-semibold text-foreground">{s.label}</span>
                    </div>
                    <div className="flex items-center border-t border-border/60 px-5 py-4 text-sm text-muted-foreground sm:border-l sm:border-t-0">
                      {s.detail}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

// Icons for the six-step flow, assigned by position (intake → extract → match →
// validate → approve → post).
const STEP_ICONS: LucideIcon[] = [Mail, FileText, Workflow, Wand2, User, CheckCircle2];

// ---------------- Copilot library (interactive catalog + modal) ----------------

function CopilotLibrary() {
  const [active, setActive] = useState<CopilotGroup | "all">("all");
  const [selected, setSelected] = useState<Copilot | null>(null);

  const items = useMemo(
    () => (active === "all" ? COPILOTS : COPILOTS.filter((c) => c.group === active)),
    [active],
  );

  return (
    <section id="copilots" className="border-b border-border/60 bg-surface-2/40 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-2 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Copilot library
          </span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Pick the copilot for the work you want off your plate.
          </h2>
          <p className="text-sm text-muted-foreground">
            Every copilot follows the same shape: it starts on a trigger, handles the busywork with
            AI, and stops for your approval before anything posts. Click any card to see how it
            runs.
          </p>
        </Reveal>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
          <div className="flex flex-wrap gap-1.5">
            {COPILOT_GROUPS.map((g) => (
              <CatalogChip
                key={g.slug}
                label={g.label}
                active={active === g.slug}
                onClick={() => setActive(g.slug)}
              />
            ))}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            Showing <b className="font-medium text-primary">{items.length}</b> of {COPILOTS.length}{" "}
            copilots
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <button
              key={c.title}
              onClick={() => setSelected(c)}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-mono text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: GROUP_META[c.group].accent }}
                >
                  {c.label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <h3 className="text-[17px] font-semibold leading-snug tracking-tight">{c.title}</h3>
              <p className="flex-1 text-sm text-muted-foreground">{c.goal}</p>
              <div className="flex items-center justify-between border-t border-dashed border-border pt-3 font-mono text-[11px] text-muted-foreground">
                <span>{c.persona}</span>
                <span className="flex items-center gap-1 text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  {c.approver}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && <CopilotModal copilot={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function CopilotModal({ copilot, onClose }: { copilot: Copilot; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const accent = GROUP_META[copilot.group].accent;

  // Reveal the run trace line by line so the flow reads as something that
  // actually executes, not a static list.
  useEffect(() => {
    setStep(0);
    if (reduceMotion) {
      setStep(copilot.trace.length);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setStep(i);
      if (i >= copilot.trace.length) clearInterval(id);
    }, 340);
    return () => clearInterval(id);
  }, [copilot, reduceMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="nice-scroll max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div>
            <span
              className="font-mono text-[10px] font-medium uppercase tracking-wider"
              style={{ color: accent }}
            >
              {copilot.label}
            </span>
            <h3 id="copilot-title" className="mt-1.5 text-2xl font-semibold tracking-tight">
              {copilot.title}
            </h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{copilot.goal}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_320px]">
          {/* Left: explanation */}
          <div className="space-y-6 p-6">
            <div>
              <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <Zap className="h-3.5 w-3.5" style={{ color: accent }} /> Starts when
              </div>
              <p className="text-sm text-foreground/90">{copilot.trigger}</p>
            </div>

            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                What the AI does
              </div>
              <ul className="space-y-2">
                {copilot.actions.map((a) => (
                  <li key={a} className="flex gap-2.5 text-sm text-foreground/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground/90">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              You stay in control — <b className="font-semibold text-primary">
                {copilot.approver}
              </b>{" "}
              approves before anything posts.
            </div>

            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                What you get
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {copilot.value.map((v) => (
                  <li key={v} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: live run trace */}
          <div className="border-t border-border bg-surface-2/60 p-6 md:border-l md:border-t-0">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Live run
              </span>
              <span className="font-mono text-[11px] text-primary">{copilot.runtime}</span>
            </div>
            <div className="space-y-2 font-mono text-[12.5px] leading-relaxed">
              {copilot.trace.map((line, i) => {
                const shown = i < step;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2 transition-opacity duration-300",
                      shown ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <TraceIcon kind={line.kind} />
                    <span
                      className={cn(
                        line.kind === "wait" && "text-amber-500 dark:text-amber-400",
                        line.kind === "done" && "font-semibold text-foreground",
                        line.kind === "run" && "text-muted-foreground",
                        line.kind === "ok" && "text-foreground/80",
                      )}
                    >
                      {line.text}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <a
                href="#cta"
                onClick={onClose}
                className="brand-gradient inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:opacity-95"
              >
                Get this copilot
              </a>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/50"
              >
                Browse more
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TraceIcon({ kind }: { kind: Copilot["trace"][number]["kind"] }) {
  if (kind === "wait")
    return <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400" />;
  if (kind === "done") return <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />;
  if (kind === "run")
    return <span className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground">▸</span>;
  return <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />;
}

// ---------------- Integration catalog ----------------

function IntegrationCatalog() {
  const [active, setActive] = useState<LandingIntegrationCategory | "all">("all");

  const items = useMemo(
    () =>
      active === "all"
        ? LANDING_INTEGRATIONS
        : LANDING_INTEGRATIONS.filter((i) => i.category === active),
    [active],
  );

  return (
    <section id="integrations" className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Integrations
          </span>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            16+ enterprise systems your copilots can talk to.
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Connect once, securely. Read and act everywhere — no dedicated policy admin or claims system required.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-1.5">
          <CatalogChip label="All" active={active === "all"} onClick={() => setActive("all")} />
          {INTEGRATION_CATEGORIES.map((c) => (
            <CatalogChip key={c} label={c} active={active === c} onClick={() => setActive(c)} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((i) => (
            <div
              key={i.slug}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5 text-center transition hover:border-primary/50 hover:shadow-sm"
            >
              <IntegrationLogo
                name={i.name}
                domain={i.domain}
                logo={i.logo}
                className="h-12 w-12"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium break-words">{i.name}</div>
                <div className="text-[11px] text-muted-foreground">{i.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CatalogChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

// ---------------- CTA ----------------

function CTASection({ onBookDemo }: { onBookDemo: () => void }) {
  return (
    <section id="cta" className="px-5 py-20">
      <Reveal pop className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl border border-border shadow-2xl">
          <SectionPhoto src={PHOTOS.advisor} icon={Shield} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/30" />
          <div className="relative max-w-xl px-6 py-16 md:px-12 md:py-20">
            <span className="font-mono text-xs uppercase tracking-wider text-primary">
              An audit-ready AI layer for insurance operations
            </span>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Give your underwriting and claims teams back their day.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              See how underwriting, claims processing, and premium reconciliation copilots run on
              your own stack — with faster approvals, smarter risk scoring, and complete visibility.
            </p>
            <button
              onClick={onBookDemo}
              className="brand-gradient mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:opacity-95"
            >
              Get started now
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ---------------- Footer ----------------

function Footer() {
  const columns: { title: string; links: string[] }[] = [
    { title: "Product", links: ["Copilots", "Platform", "Integrations", "Security"] },
    { title: "Solutions", links: ["Underwriting", "Claims processing", "Customer onboarding", "Risk & reporting"] },
    { title: "Company", links: ["About", "Customers", "Careers", "Contact"] },
  ];
  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center">
              <LogoLockup />
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The AI operating system for insurance — underwriting, claims, customer onboarding, and
              premium operations, with a human in control of every action.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="transition hover:text-foreground">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Insurance AI OS. All rights reserved.</div>
          <div className="font-mono">The AI operating system for insurance</div>
        </div>
      </div>
    </footer>
  );
}

// ---------------- Auth modal ----------------

function AuthModal({
  onClose,
  onAuthenticated,
}: {
  onClose: () => void;
  onAuthenticated: () => void;
}) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [status, setStatus] = useState<null | string>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    firstFieldRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    firstFieldRef.current?.focus();
    setStatus(null);
  }, [tab]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 id="auth-title" className="text-lg font-semibold">
              {tab === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {tab === "login"
                ? "Sign in to your workspace."
                : "Get access to your insurance copilots."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-background p-1">
          <button
            onClick={() => setTab("login")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === "login" ? "bg-surface text-foreground" : "text-muted-foreground"
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === "signup" ? "bg-surface text-foreground" : "text-muted-foreground"
            }`}
          >
            Sign up
          </button>
        </div>

        {status ? (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm">
            {status}
            <div className="mt-4">
              <button
                onClick={onClose}
                className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        ) : tab === "login" ? (
          <LoginForm firstFieldRef={firstFieldRef} onAuthenticated={onAuthenticated} />
        ) : (
          <SignupForm firstFieldRef={firstFieldRef} onAuthenticated={onAuthenticated} />
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
      {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function LoginForm({
  firstFieldRef,
  onAuthenticated,
}: {
  firstFieldRef: React.RefObject<HTMLInputElement | null>;
  onAuthenticated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    else if (!isEmail(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await api.login(email, password);
      onAuthenticated(); // navigates into the workspace (/app)
    } catch (err) {
      let msg = "Could not reach the platform. Is the backend running?";
      if (err instanceof ApiError) {
        // The backend replied — show why (bad credentials, no tenant/org, etc.).
        msg = err.status === 401 ? "Invalid email or password." : err.message;
      }
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <Field label="Work email" error={errors.email}>
        <input
          ref={firstFieldRef}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="you@company.com"
          autoComplete="email"
        />
      </Field>
      <Field label="Password" error={errors.password}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </Field>
      <div className="flex items-center justify-between">
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
          Forgot password?
        </button>
      </div>
      {errors.form && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errors.form}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Log in"}
      </button>
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="h-px w-full bg-border" />
        </div>
        <div className="relative text-center">
          <span className="bg-surface px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            or
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setErrors({ form: "SSO isn't wired yet — sign in with email + password." })}
        className="w-full rounded-md border border-border bg-background py-2 text-sm font-medium hover:border-primary"
      >
        Continue with SSO
      </button>
    </form>
  );
}

function SignupForm({
  firstFieldRef,
  onAuthenticated,
}: {
  firstFieldRef: React.RefObject<HTMLInputElement | null>;
  onAuthenticated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email) errs.email = "Email is required";
    else if (!isEmail(email)) errs.email = "Enter a valid work email";
    if (!company.trim()) errs.company = "Company is required";
    if (!password || password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await api.signup({ name, email, company, password });
      onAuthenticated(); // account created + signed in — go straight into /app
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not create your account. Try again.";
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <Field label="Full name" error={errors.name}>
        <input
          ref={firstFieldRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="Ada Lovelace"
        />
      </Field>
      <Field label="Work email" error={errors.email}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="you@company.com"
          autoComplete="email"
        />
      </Field>
      <Field label="Company" error={errors.company}>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className={inputCls}
          placeholder="Acme LLP"
        />
      </Field>
      <Field label="Password" error={errors.password}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
      </Field>
      {errors.form && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errors.form}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
