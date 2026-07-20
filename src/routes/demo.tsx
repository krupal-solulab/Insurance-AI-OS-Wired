import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Calendar,
  CheckCircle2,
  Cloud,
  FileText,
  Landmark,
  Moon,
  Server,
  ShieldCheck,
  Sparkles,
  Sun,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import { LogoLockup } from "../components/common/LogoLockup";
import { ThemeProvider, useTheme } from "../lib/theme";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/demo")({ component: Demo });

/* ─────────────────────────  Content (insurance)  ───────────────────────── */

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: FileText,
    title: "Document Intelligence",
    description:
      "See Eagle Doc read applications, claim forms, and medical reports — extracting clean, structured data with a confidence score on every field.",
  },
  {
    icon: Workflow,
    title: "Underwriting, Claims & Fraud Copilots",
    description:
      "Watch policy underwriting, claims processing, and fraud detection run end to end, surfacing only the exceptions that need you.",
  },
  {
    icon: ShieldCheck,
    title: "Approvals & Controls",
    description:
      "See underwriting, claims, and finance approvals with policy checks and human sign-off enforced before anything is issued or settled.",
  },
  {
    icon: Landmark,
    title: "Works With Your Stack",
    description:
      "See how copilots connect securely to Salesforce, DocuSign, email, storage, and Slack — writing records back or falling back to Google Sheets.",
  },
];

const valuePoints = [
  "Underwrite policies in minutes, not hours",
  "Catch fraudulent and mispriced claims before payout",
  "Predict settlement times and keep customers informed",
  "Free your team from manual data entry",
];

const trustBadges: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: "Enterprise Ready" },
  { icon: Cloud, label: "Private Cloud" },
  { icon: Server, label: "On-Premises" },
  { icon: BadgeCheck, label: "SOC 2 Ready" },
  { icon: Sparkles, label: "Explainable AI" },
];

const nextSteps = [
  "We'll contact you within one business day.",
  "We'll understand your current underwriting and claims workflows.",
  "We'll tailor the demonstration around your operations.",
  "You'll see how it integrates with your existing policy admin system and tools.",
  "We'll discuss implementation approach and expected ROI.",
];

const platformLogos = ["Salesforce", "DocuSign", "Gmail", "Google Drive", "Slack", "Google Sheets"];

const teamSizeOptions = ["1–5", "6–20", "21–50", "51–200", "200+"];
const ledgerOptions = [
  "Salesforce",
  "HubSpot",
  "Microsoft Dynamics 365",
  "NetSuite",
  "Google Sheets (no core system)",
  "Other",
];

const DEMO_REQUESTS_KEY = "aios.demo_requests";

/* ─────────────────────────  Page  ───────────────────────── */

function Demo() {
  return (
    <ThemeProvider>
      <DemoContent />
    </ThemeProvider>
  );
}

function DemoContent() {
  const { theme } = useTheme();
  return (
    <div
      className={cn(
        "landing-root min-h-screen bg-background text-foreground",
        theme === "dark" && "dark",
      )}
    >
      <DemoNav />
      <div className="mx-auto max-w-7xl px-5 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* LEFT — value proposition */}
          <div className="lg:col-span-7">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              See the platform in action
            </div>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
              Book your personalized demo
            </h1>

            <div className="mt-5 max-w-2xl space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>Every insurance operation runs differently.</p>
              <p>
                Different core systems. Different products. Different lines of business, customers,
                and approval policies.
              </p>
              <p>That's why every demonstration is tailored specifically to your business.</p>
              <p>
                During the session, we'll show how the platform connects to your existing enterprise
                systems, automates policy underwriting, claims processing, and fraud detection, and
                keeps a human in control of every action — with a full audit trail.
              </p>
            </div>

            {/* What you'll see */}
            <div className="mt-10">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                What you'll see
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.title}
                      className="rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                        {f.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Business value panel */}
            <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-primary" />
                Why insurance leaders choose us
              </h3>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {valuePoints.map((v) => (
                  <li key={v} className="flex items-start gap-2.5 text-sm text-foreground/90">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT — demo request form */}
          <div className="lg:col-span-5">
            <div className="space-y-5 lg:sticky lg:top-24">
              <DemoForm />
              <NextStepsPanel />
            </div>
          </div>
        </div>

        {/* Bottom: trusted-by */}
        <div className="mt-16 border-t border-border pt-10 text-center">
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Trusted by insurance teams turning document busywork into reviewed, audit-ready output.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {platformLogos.map((name) => (
              <span
                key={name}
                className="select-none text-lg font-semibold tracking-wide text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  Nav  ───────────────────────── */

function DemoNav() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center">
          <LogoLockup className="ml-2" />
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────  Form  ───────────────────────── */

type FormState = {
  fullName: string;
  email: string;
  company: string;
  jobTitle: string;
  teamSize: string;
  ledger: string;
  message: string;
};

const inputCls =
  "w-full h-10 px-3.5 rounded-md bg-surface border border-border text-sm placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-primary/20 focus:border-primary/60";
const labelCls = "mb-1.5 block text-xs font-medium text-muted-foreground";

function DemoForm() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    company: "",
    jobTitle: "",
    teamSize: "",
    ledger: "",
    message: "",
  });

  const update =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy backend: persist the request to localStorage, consistent with the
    // rest of the demo (no real endpoint wired yet).
    try {
      const existing = JSON.parse(window.localStorage.getItem(DEMO_REQUESTS_KEY) ?? "[]");
      existing.push({ ...form, at: new Date().toISOString() });
      window.localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(existing));
    } catch {
      /* ignore storage errors */
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Request received</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Thank you, {form.fullName.split(" ")[0] || "there"}. A specialist will reach out within one
          business day to schedule your personalized demonstration.
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-surface p-6 transition focus-within:border-primary/40"
    >
      <h2 className="text-lg font-semibold">Request your demo</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        Complete the form and our team will schedule a personalized demonstration based on your
        workflows and insurance stack.
      </p>

      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Full name</label>
            <input
              required
              value={form.fullName}
              onChange={update("fullName")}
              placeholder="Jordan Reyes"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Work email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="jordan@company.com"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Company</label>
            <input
              required
              value={form.company}
              onChange={update("company")}
              placeholder="Acme LLP"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Job title</label>
            <input
              required
              value={form.jobTitle}
              onChange={update("jobTitle")}
              placeholder="Claims Manager"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Insurance team size</label>
            <select required value={form.teamSize} onChange={update("teamSize")} className={inputCls}>
              <option value="" disabled>
                Select range
              </option>
              {teamSizeOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Current core system</label>
            <select required value={form.ledger} onChange={update("ledger")} className={inputCls}>
              <option value="" disabled>
                Select core system
              </option>
              {ledgerOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Message</label>
          <textarea
            value={form.message}
            onChange={update("message")}
            rows={3}
            placeholder="Tell us about your insurance operations, current challenges, or what you'd like to see during the demo."
            className={`${inputCls} h-auto resize-none py-2.5`}
          />
        </div>

        <button
          type="submit"
          className="brand-gradient flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:opacity-95"
        >
          <Calendar className="h-4 w-4" />
          Book my demo
        </button>
      </div>

      {/* Trust badges */}
      <div className="mt-6 grid grid-cols-5 gap-1.5 border-t border-border pt-5">
        {trustBadges.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.label}
              title={b.label}
              className="group flex cursor-default flex-col items-center gap-1.5 text-center"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface-2 transition group-hover:-translate-y-0.5 group-hover:border-primary/40">
                <Icon className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <span className="text-[9px] leading-tight text-muted-foreground">{b.label}</span>
            </div>
          );
        })}
      </div>
    </form>
  );
}

function NextStepsPanel() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold">What happens next?</h3>
      <ol className="mt-3 space-y-2.5">
        {nextSteps.map((step, i) => (
          <li
            key={step}
            className="flex items-start gap-3 text-[13px] leading-relaxed text-muted-foreground"
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 text-[11px] font-semibold text-primary">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
