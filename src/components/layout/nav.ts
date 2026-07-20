import {
  BarChart3,
  Bot,
  BookOpen,
  Cable,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Scale,
  Settings,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Single source of truth for the app navigation. Industry-neutral labels only.
// `managerOnly` items are hidden unless the user is owner/admin (RBAC).
export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  managerOnly?: boolean;
  /** Shown in the sidebar but not clickable (page parked for the demo). */
  disabled?: boolean;
};

export const NAV: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/assistant", label: "AI Assistant", icon: Bot },
  { to: "/app/documents", label: "Documents", icon: FileText },
  { to: "/app/workflows", label: "Workflows", icon: Workflow },
  { to: "/app/approvals", label: "Approvals", icon: ClipboardCheck },
  { to: "/app/knowledge", label: "Knowledge", icon: BookOpen },
  { to: "/app/connectors", label: "Connectors", icon: Cable },
  { to: "/app/rules", label: "Rules console", icon: Scale },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/admin", label: "Admin", icon: ShieldCheck, managerOnly: true },
  { to: "/app/settings", label: "Settings", icon: Settings },
];
