import { useMutation, useQueryClient } from "@tanstack/react-query";

import { startPackWorkflow } from "../client";

/** Start a pack workflow run (e.g. submission_triage), then refresh the queue so the new
 * run appears. Inputs are optional — submission_triage reads the newest broker email (or
 * the sandbox fixture) when none are supplied. */
export const useStartPackRun = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workflowKey,
      packKey,
      inputs = {},
    }: {
      workflowKey: string;
      packKey: string;
      inputs?: Record<string, unknown>;
    }) => startPackWorkflow(workflowKey, packKey, inputs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pack-runs"] });
    },
  });
};
