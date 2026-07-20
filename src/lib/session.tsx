// Authenticated session: fetches /me once (via TanStack Query) and exposes it plus
// role helpers to the whole app shell. Reuses the existing token-based auth — the
// tenant comes from the backend (JWT), never the client.

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { api, type Me } from "../api";

type SessionCtx = {
  me: Me | null;
  isLoading: boolean;
  error: unknown;
  hasRole: (...roles: string[]) => boolean;
  isManager: boolean; // owner or admin
};

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({
  children,
  onUnauthenticated,
}: {
  children: ReactNode;
  onUnauthenticated?: () => void;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: api.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (error && onUnauthenticated) onUnauthenticated();

  const me = data ?? null;
  const roles = me?.roles ?? [];
  const hasRole = (...want: string[]) => want.some((r) => roles.includes(r));
  const isManager = hasRole("owner", "admin");

  return (
    <Ctx.Provider value={{ me, isLoading, error, hasRole, isManager }}>{children}</Ctx.Provider>
  );
}

export function useSession(): SessionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
