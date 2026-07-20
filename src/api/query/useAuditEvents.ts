import { useQuery } from "@tanstack/react-query";

import { listAuditEvents } from "../client";

/**
 * Audit events, scoped by an explicit key segment so different call sites
 * (recent/admin/all) keep independent caches. `enabled` gates manager-only views.
 */
export const useAuditEvents = (scope: string, limit: number, enabled = true) =>
  useQuery({
    queryKey: ["audit", scope],
    queryFn: () => listAuditEvents({ limit }),
    enabled,
  });
