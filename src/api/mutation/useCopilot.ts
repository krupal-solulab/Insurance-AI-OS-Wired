import { useMutation } from "@tanstack/react-query";

import { askCopilot } from "../client";

/** Ask the grounded Submission Copilot a question about one run. The backend answers
 * strictly from that run's real step outputs (extraction / checks / recommendation) and
 * returns any citations the run produced. Not cached — each question is a fresh ask. */
export const useCopilot = () =>
  useMutation({
    mutationFn: ({ runId, question }: { runId: string; question: string }) =>
      askCopilot(runId, question),
  });
