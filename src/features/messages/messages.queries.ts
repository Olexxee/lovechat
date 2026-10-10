import { useQuery } from "@tanstack/react-query";
import { getMessages } from "../../services/api";
import { messageKeys } from "./messages.keys";

export function useMessages(conversationId: number, enabled = true) {
  return useQuery({
    queryKey: messageKeys.conversation(conversationId),
    queryFn: () => getMessages(conversationId),
    enabled: enabled && Number.isInteger(conversationId) && conversationId > 0,
    staleTime: 15_000,
    retry: 1,
  });
}
