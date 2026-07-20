import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteChatSession } from "../client";

/** Delete a chat session, then refresh the Conversations sidebar. */
export const useDeleteChatSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChatSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-sessions"] }),
  });
};
