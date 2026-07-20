// Sample integrations catalog — the "Nango-style" API catalog that powers both the
// public landing grid and the in-app Connector Hub. In the real product this list
// comes from the connectors service; until that endpoint exists, this static
// catalog gives the catalog UI a full, realistic shape to render.
//
// `domain` feeds the Clearbit logo CDN (https://logo.clearbit.com/<domain>); when a
// logo fails to load the UI falls back to the integration's initials.

export type IntegrationCategory =
  "ERP" | "Email" | "Storage" | "Collaboration" | "Forms & Docs" | "Productivity";

export type Integration = {
  slug: string;
  name: string;
  domain: string;
  category: IntegrationCategory;
  /** True for the auth/comms platform (Nango), false for action platform (Composio). */
  auth?: boolean;
  /**
   * Explicit logo URL. Use when the favicon service can't distinguish a brand —
   * e.g. Google Workspace apps all share the google.com favicon, so each needs
   * its own product logo.
   */
  logo?: string;
};

export const CATEGORIES: IntegrationCategory[] = [
  "ERP",
  "Email",
  "Storage",
  "Collaboration",
  "Forms & Docs",
  "Productivity",
];

export const INTEGRATIONS: Integration[] = [
  // ERP
  { slug: "netsuite", name: "NetSuite", domain: "netsuite.com", category: "ERP" },
  { slug: "odoo", name: "Odoo", domain: "odoo.com", category: "ERP" },
  { slug: "dynamics-365", name: "Microsoft Dynamics 365", domain: "microsoft.com", category: "ERP" },
  { slug: "salesforce", name: "Salesforce", domain: "salesforce.com", category: "ERP" },
  { slug: "hubspot", name: "HubSpot", domain: "hubspot.com", category: "ERP" },

  // Email
  { slug: "gmail", name: "Gmail", domain: "gmail.com", category: "Email", auth: true },
  { slug: "outlook", name: "Outlook", domain: "outlook.com", category: "Email", auth: true },

  // Storage
  {
    slug: "gdrive",
    name: "Google Drive",
    domain: "drive.google.com",
    category: "Storage",
    auth: true,
    logo: "https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png",
  },
  { slug: "sharepoint", name: "SharePoint", domain: "microsoft.com", category: "Storage" },
  { slug: "onedrive", name: "OneDrive", domain: "onedrive.live.com", category: "Storage", auth: true },
  { slug: "dropbox", name: "Dropbox", domain: "dropbox.com", category: "Storage", auth: true },

  // Collaboration
  { slug: "slack", name: "Slack", domain: "slack.com", category: "Collaboration" },
  { slug: "teams", name: "Microsoft Teams", domain: "microsoft.com", category: "Collaboration" },
  {
    slug: "gcalendar",
    name: "Google Calendar",
    domain: "calendar.google.com",
    category: "Collaboration",
    auth: true,
    logo: "https://ssl.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png",
  },
  { slug: "outlook-calendar", name: "Outlook Calendar", domain: "outlook.com", category: "Collaboration" },

  // Forms & Docs
  { slug: "gforms", name: "Google Forms", domain: "docs.google.com", category: "Forms & Docs", auth: true },
  { slug: "typeform", name: "Typeform", domain: "typeform.com", category: "Forms & Docs" },
  { slug: "docusign", name: "DocuSign", domain: "docusign.com", category: "Forms & Docs" },

  // Productivity
  {
    slug: "gsheets",
    name: "Google Sheets",
    domain: "sheets.google.com",
    category: "Productivity",
    logo: "https://ssl.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png",
  },
  { slug: "excel", name: "Microsoft Excel", domain: "microsoft.com", category: "Productivity" },
];

export function logoUrl(domain: string): string {
  // Google's favicon service returns the site's real brand icon and is far more
  // reliable than the (now-defunct) Clearbit logo CDN. sz=128 keeps it crisp.
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export function initials(name: string): string {
  return name
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
