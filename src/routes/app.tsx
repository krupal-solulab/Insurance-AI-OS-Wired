import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { api } from "../api";
import { AppHeader } from "../components/layout/AppHeader";
import { AppSidebar } from "../components/layout/AppSidebar";
import { SessionProvider } from "../lib/session";
import { ThemeProvider, useTheme } from "../lib/theme";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

// The authenticated application shell. Guards on the token, then wraps everything in
// the Theme + Session providers and renders sidebar + header + the routed page.
function AppLayout() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(!!api.getToken());
    if (!api.getToken()) navigate({ to: "/" });
  }, [navigate]);

  if (authed === false) return null; // redirecting
  return (
    <ThemeProvider>
      <SessionProvider
        onUnauthenticated={() => {
          api.logout();
          navigate({ to: "/" });
        }}
      >
        <Shell />
      </SessionProvider>
    </ThemeProvider>
  );
}

function Shell() {
  const { theme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className={cn(
        "app-shell flex h-screen w-full overflow-hidden bg-background",
        theme === "dark" && "dark",
      )}
    >
      <AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onMenu={() => setMobileOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] p-5 lg:p-6 xl:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
