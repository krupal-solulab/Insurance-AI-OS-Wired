import { useMutation, useQueryClient } from "@tanstack/react-query";

import { renameChatSession } from "../client";

/** Rename a chat session, then refresh the Conversations sidebar. */
export const useRenameChatSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameChatSession(id, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-sessions"] }),
  });
};
