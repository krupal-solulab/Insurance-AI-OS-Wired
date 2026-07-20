import { useMutation, useQueryClient } from "@tanstack/react-query";

import { configureConnector } from "../client";

/** Enable/disable + configure a connector (admin only — the backend gates it). */
export const useConfigureConnector = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { key: string; enabled: boolean; config?: Record<string, unknown> }) =>
      configureConnector(v.key, { enabled: v.enabled, config: v.config }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });
};
