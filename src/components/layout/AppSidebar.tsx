import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

import { LogoLockup } from "../common/LogoLockup";
import { useSession } from "../../lib/session";
import { NAV } from "./nav";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { isManager } = useSession();
  const items = NAV.filter((i) => !i.managerOnly || isManager);
  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {items.map((item) =>
        item.disabled ? (
          <button
            key={item.to}
            type="button"
            aria-disabled="true"
            className="flex cursor-default items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground/50"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        ) : (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
            activeProps={{
              className:
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium bg-primary/10 text-primary",
            }}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex h-16 items-center border-b border-border px-4">
      <LogoLockup />
    </div>
  );
}

export function AppSidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Desktop: fixed rail */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <Brand />
        <NavLinks />
        <div className="border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
          Enterprise AI OS · v0.1
        </div>
      </aside>

      {/* Mobile: slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border pr-2">
              <Brand />
              <button
                onClick={onClose}
                className="rounded-md p-2 hover:bg-surface-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavLinks onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
