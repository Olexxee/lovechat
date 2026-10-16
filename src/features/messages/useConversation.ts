import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getMessages } from "../../services/api";

import { useMessages } from "./messages.queries";
import { messageKeys } from "./messages.keys";
import {
  messagingEngine,
  type MessagingMessage,
  type MessagingState,
} from "./messaging.engine";

type UseConversationOptions = {
  conversationId: number;
  userId: number;
  enabled?: boolean;
};

export function useConversation({
  conversationId,
  userId,
  enabled = true,
}: UseConversationOptions) {
  const queryClient = useQueryClient();

  const validConversation =
    enabled &&
    Number.isInteger(conversationId) &&
    conversationId > 0 &&
    Number.isInteger(userId) &&
    userId > 0;

  const messagesQuery = useMessages(conversationId, validConversation);

  const [messagingState, setMessagingState] = useState<MessagingState>(() =>
    messagingEngine.getState(conversationId),
  );
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [noOlderPagesByConversation, setNoOlderPagesByConversation] = useState<
    Record<number, boolean>
  >({});
  const noOlderPages = Boolean(noOlderPagesByConversation[conversationId]);

  useEffect(() => {
    messagingEngine.configure(queryClient);
  }, [queryClient]);

  useEffect(() => {
    if (!validConversation) return;

    return messagingEngine.subscribe(conversationId, userId, setMessagingState);
  }, [conversationId, userId, validConversation]);

  const sendMessage = useCallback(
    (
      content: string,
      attachmentIds: number[] = [],
    ): Promise<MessagingMessage> => {
      if (!validConversation) {
        return Promise.reject(new Error("This conversation is not available."));
      }

      return messagingEngine.sendMessage(
        conversationId,
        content,
        attachmentIds,
      );
    },
    [conversationId, validConversation],
  );

  const retryMessage = useCallback(
    (clientMessageId: string): Promise<MessagingMessage> => {
      if (!validConversation) {
        return Promise.reject(new Error("This conversation is not available."));
      }

      return messagingEngine.retryMessage(conversationId, clientMessageId);
    },
    [conversationId, validConversation],
  );

  const sendTyping = useCallback(
    (typing: boolean) => {
      if (validConversation) {
        messagingEngine.sendTyping(conversationId, typing);
      }
    },
    [conversationId, validConversation],
  );

  const markAsRead = useCallback(
    (messageId: number) => {
      if (validConversation && messageId > 0) {
        messagingEngine.markAsRead(conversationId, messageId);
      }
    },
    [conversationId, validConversation],
  );

  const loadOlderMessages = useCallback(async (): Promise<boolean> => {
    if (!validConversation || isLoadingOlder || noOlderPages) {
      return false;
    }

    const current =
      queryClient.getQueryData<MessagingMessage[]>(
        messageKeys.conversation(conversationId),
      ) ?? [];
    const oldestMessage = current.find((message) => message.id > 0);

    if (!oldestMessage) return false;

    setIsLoadingOlder(true);
    try {
      const older = await getMessages(conversationId, oldestMessage.id, 50);
      if (older.length < 50) {
        setNoOlderPagesByConversation((current) => ({
          ...current,
          [conversationId]: true,
        }));
      }

      queryClient.setQueryData<MessagingMessage[]>(
        messageKeys.conversation(conversationId),
        (latest) => {
          const combined = new Map<string, MessagingMessage>();
          for (const message of [
            ...older,
            ...((latest ?? []) as MessagingMessage[]),
          ]) {
            const key = message.client_message_id
              ? "client:" + message.client_message_id
              : "id:" + message.id;
            const prior = combined.get(key);
            if (!prior || (prior.id <= 0 && message.id > 0)) {
              combined.set(key, message);
            }
          }
          return [...combined.values()].sort((a, b) => {
            const timeDifference =
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime();
            return timeDifference || a.id - b.id;
          });
        },
      );
      return older.length > 0;
    } finally {
      setIsLoadingOlder(false);
    }
  }, [
    conversationId,
    isLoadingOlder,
    noOlderPages,
    queryClient,
    validConversation,
  ]);

  const hasOlderMessages =
    !noOlderPages && (messagesQuery.data?.length ?? 0) >= 50;

  const refetch = useCallback(
    () => messagesQuery.refetch(),
    [messagesQuery.refetch],
  );

  return {
    messages: (messagesQuery.data ?? []) as MessagingMessage[],
    isLoading: messagesQuery.isLoading,
    queryError: messagesQuery.error,
    refetch,
    loadOlderMessages,
    hasOlderMessages,
    isLoadingOlder,

    connectionStatus: messagingState.connectionStatus,
    isTyping: messagingState.isTyping,
    partnerOnline: messagingState.partnerOnline,
    messagingError: messagingState.error,

    sendMessage,
    retryMessage,
    sendTyping,
    markAsRead,
  };
}
