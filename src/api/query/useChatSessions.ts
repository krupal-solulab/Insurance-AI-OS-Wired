import { useQuery } from "@tanstack/react-query";

import { api } from "../client";

/** This user's chat sessions for the Conversations sidebar (most-recent-first). */
export const useChatSessions = () =>
  useQuery({ queryKey: ["chat-sessions"], queryFn: api.listChatSessions });
