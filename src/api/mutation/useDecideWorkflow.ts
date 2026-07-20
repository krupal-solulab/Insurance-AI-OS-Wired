import { useMutation, useQueryClient } from "@tanstack/react-query";

import { approveWorkflow, rejectWorkflow } from "../client";

/** Approve or reject a single workflow, then refresh the workflow list. */
export const useDecideWorkflow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workflowId,
      approve,
      comment,
    }: {
      workflowId: string;
      approve: boolean;
      comment: string;
    }) => (approve ? approveWorkflow(workflowId, comment) : rejectWorkflow(workflowId, comment)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
};
