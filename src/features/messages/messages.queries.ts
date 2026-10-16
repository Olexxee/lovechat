import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessages, type Message } from "../../services/api";
import { messageKeys } from "./messages.keys";

function mergePages(existing: Message[], incoming: Message[]): Message[] {
  const byIdentity = new Map<string, Message>();

  for (const message of existing) {
    const key = message.client_message_id
      ? `client:${message.client_message_id}`
      : `id:${message.id}`;
    byIdentity.set(key, message);
  }

  for (const message of incoming) {
    const key = message.client_message_id
      ? `client:${message.client_message_id}`
      : `id:${message.id}`;
    byIdentity.set(key, message);
  }

  return [...byIdentity.values()].sort((a, b) => {
    const timeDifference =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return timeDifference || a.id - b.id;
  });
}

export function useMessages(conversationId: number, enabled = true) {
  const queryClient = useQueryClient();
  const queryKey = messageKeys.conversation(conversationId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const latest = await getMessages(conversationId, undefined, 50);
      const cached = queryClient.getQueryData<Message[]>(queryKey) ?? [];
      return mergePages(cached, latest);
    },
    enabled: enabled && Number.isInteger(conversationId) && conversationId > 0,
    staleTime: 15_000,
    retry: 1,
  });
}
