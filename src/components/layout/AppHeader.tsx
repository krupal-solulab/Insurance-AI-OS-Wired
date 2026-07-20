import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Building2, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { useState } from "react";

import { api } from "../../api";
import { useSession } from "../../lib/session";
import { useTheme } from "../../lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { EmptyState } from "../common/states";

function initials(text: string | null | undefined): string {
  if (!text) return "U";
  const base = text.split("@")[0];
  return base.slice(0, 2).toUpperCase();
}

export function AppHeader({ onMenu }: { onMenu: () => void }) {
  const { me } = useSession();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");

  const signOut = () => {
    api.logout();
    qc.clear();
    navigate({ to: "/" });
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Global search maps to the Knowledge (semantic search) page.
    navigate({ to: "/app/knowledge" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur md:px-6">
      {/* Mobile menu */}
      <button
        onClick={onMenu}
        className="rounded-md p-2 hover:bg-surface-2 lg:hidden"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Organization selector — current tenant. Multi-org switching needs backend support. */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-surface-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[140px] truncate font-medium">
            {me?.tenant_slug ?? me?.tenant_id ?? "Organization"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Organization</DropdownMenuLabel>
          <DropdownMenuItem className="flex flex-col items-start gap-0.5">
            <span className="font-medium">{me?.tenant_slug ?? me?.tenant_id}</span>
            <span className="text-xs text-muted-foreground">Current tenant</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search */}
      <form onSubmit={onSearch} className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search knowledge…"
          className="w-full rounded-md border border-border bg-background py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </form>

      <div className="ml-auto flex items-center gap-1">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded-md p-2 hover:bg-surface-2"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <div className="p-2">
              <EmptyState title="You're all caught up" description="No new notifications." />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme */}
        <button
          onClick={toggle}
          className="rounded-md p-2 hover:bg-surface-2"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-surface-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {initials(me?.email ?? me?.user_id)}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate">{me?.email ?? me?.user_id}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {me?.roles.join(" · ") || "no roles"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/app/settings" })}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
