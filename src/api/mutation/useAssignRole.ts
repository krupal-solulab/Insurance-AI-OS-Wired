import { useMutation, useQueryClient } from "@tanstack/react-query";

import { assignRole } from "../client";

export const useAssignRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => assignRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};
