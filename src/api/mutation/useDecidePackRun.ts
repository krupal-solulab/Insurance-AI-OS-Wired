import { useMutation, useQueryClient } from "@tanstack/react-query";

import { approvePackRun, rejectPackRun } from "../client";

/** Approve or reject a pack run at its human-review gate, then refresh the queue + run view. */
export const useDecidePackRun = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, approve, comment = "" }: { runId: string; approve: boolean; comment?: string }) =>
      approve ? approvePackRun(runId, comment) : rejectPackRun(runId, comment),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["pack-runs"] });
      qc.invalidateQueries({ queryKey: ["pack-run", vars.runId] });
    },
  });
};
