import { useQuery } from "@tanstack/react-query";

import { getPackRun, listPackRuns } from "../client";

/** Pack runs for a queue (e.g. Submissions = workflow_key "submission_triage"), optionally
 *  filtered by status. Polls so newly-started / awaiting-approval runs surface. */
export const usePackRuns = (opts?: { status?: string; workflow_key?: string; limit?: number }) =>
  useQuery({
    queryKey: ["pack-runs", opts?.status ?? "all", opts?.workflow_key ?? "all"],
    queryFn: () => listPackRuns(opts),
    refetchInterval: 4000,
  });

/** Live view of one run (steps + per-step outputs + summary). Polls while in flight. */
export const usePackRun = (runId: string | null) =>
  useQuery({
    queryKey: ["pack-run", runId],
    queryFn: () => getPackRun(runId as string),
    enabled: Boolean(runId),
    refetchInterval: 3000,
  });
