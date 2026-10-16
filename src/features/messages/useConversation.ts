import React, { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useMessages } from "./messages.queries";
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

  useEffect(() => {
    messagingEngine.configure(queryClient);
  }, [queryClient]);

  useEffect(() => {
    if (!validConversation) return;

    return messagingEngine.subscribe(
      conversationId,
      userId,
      setMessagingState,
    );
  }, [conversationId, userId, validConversation]);

  const sendMessage = useCallback(
    (
      content: string,
      attachmentIds: number[] = [],
      replyToMessageId?: number | null,
    ): Promise<MessagingMessage> => {
      if (!validConversation) {
        return Promise.reject(
          new Error("This conversation is not available."),
        );
      }

      return messagingEngine.sendMessage(
        conversationId,
        content,
        attachmentIds,
        replyToMessageId,
      );
    },
    [conversationId, validConversation],
  );

  const retryMessage = useCallback(
    (clientMessageId: string): Promise<MessagingMessage> => {
      if (!validConversation) {
        return Promise.reject(
          new Error("This conversation is not available."),
        );
      }

      return messagingEngine.retryMessage(
        conversationId,
        clientMessageId,
      );
    },
    [conversationId, validConversation],
  );

  const deleteMessage = useCallback(
    (messageId: number): Promise<MessagingMessage> => {
      if (!validConversation) {
        return Promise.reject(
          new Error("This conversation is not available."),
        );
      }

      if (!Number.isInteger(messageId) || messageId <= 0) {
        return Promise.reject(new Error("Invalid message ID."));
      }

      return messagingEngine.deleteMessage(
        conversationId,
        messageId,
      );
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

  const refetch = useCallback(
    () => messagesQuery.refetch(),
    [messagesQuery.refetch],
  );

  return {
    messages: (messagesQuery.data ?? []) as MessagingMessage[],
    isLoading: messagesQuery.isLoading,
    queryError: messagesQuery.error,
    refetch,

    connectionStatus: messagingState.connectionStatus,
    isTyping: messagingState.isTyping,
    partnerOnline: messagingState.partnerOnline,
    messagingError: messagingState.error,

    sendMessage,
    retryMessage,
    deleteMessage,
    sendTyping,
    markAsRead,
  };
}