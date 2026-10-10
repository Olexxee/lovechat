import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import ChatHeader from "../../components/chat/ChatHeader";
import Composer, { PendingAttachment } from "../../components/chat/Composer";
import MessageBubble from "../../components/chat/MessageBubble";
import TypingIndicator from "../../components/chat/TypingIndicator";
import {
  getRelationships,
  uploadChatAttachment,
  type Relationship,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { colors, radius, spacing } from "../../constants/theme";
import { useConversation } from "../../features/messages/useConversation";
import type { MessagingMessage } from "../../features/messages/messaging.engine";




function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) return "Today";

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

function sameDay(first: string, second: string) {
  return new Date(first).toDateString() === new Date(second).toDateString();
}

export default function ConversationScreen() {
  const { conversationId: rawConversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();

  const { user } = useAuth();
  const conversationId = Number(rawConversationId);

  const listRef = useRef<FlatList<MessagingMessage>>(null);

  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [isLoadingRelationship, setIsLoadingRelationship] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const {
    messages,
    isLoading: isLoadingMessages,
    queryError,
    connectionStatus,
    isTyping,
    partnerOnline,
    messagingError,
    sendMessage,
    retryMessage,
    sendTyping,
    markAsRead,
  } = useConversation({
    conversationId,
    userId: user?.id ?? 0,
    enabled: Boolean(user?.id),
  });

  const isLoading = isLoadingRelationship || isLoadingMessages;
  const partnerName = relationship?.partner.name ?? "Conversation";

  const visibleError =
    error ||
    messagingError ||
    (queryError instanceof Error ? queryError.message : "");

  useEffect(() => {
    let cancelled = false;

    async function loadRelationship() {
      if (!Number.isInteger(conversationId) || conversationId <= 0) {
        setError("This conversation link is invalid.");
        setIsLoadingRelationship(false);
        return;
      }

      if (!user?.id) return;

      setIsLoadingRelationship(true);
      setError("");

      try {
        const relationships = await getRelationships();

        if (cancelled) return;

        const current = relationships.find(
          (item) => item.conversation_id === conversationId,
        );

        if (!current) {
          setError("You don't have access to this conversation.");
          return;
        }

        setRelationship(current);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this conversation.",
          );
        }
      } finally {
        if (!cancelled) setIsLoadingRelationship(false);
      }
    }

    void loadRelationship();

    return () => {
      cancelled = true;
    };
  }, [conversationId, user?.id]);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    const hasAttachments = pendingAttachments.length > 0;

    if ((!content && !hasAttachments) || isSending) return;

    setIsSending(true);
    setError("");

    let assetIds: number[];

    try {
      // Upload attachments first. The messaging engine receives the
      // resulting asset IDs and handles message delivery and retries.
      if (hasAttachments) {
        const uploaded = await Promise.all(
          pendingAttachments.map((attachment) =>
            uploadChatAttachment(
              conversationId,
              attachment.uri,
              attachment.filename,
              attachment.mimeType,
            ),
          ),
        );

        assetIds = uploaded.map((asset) => asset.id);
      } else {
        assetIds = [];
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload your attachments.",
      );
      setIsSending(false);
      return;
    }

    try {
      await sendMessage(content, assetIds);

      setDraft("");
      setPendingAttachments([]);
      sendTyping(false);
    } catch (err) {
      // The engine keeps the optimistic message and its retry ID.
      // Leave the composer content intact if delivery failed.
      setError(
        err instanceof Error
          ? err.message
          : "Your message could not be sent. Retry the failed message below.",
      );
    } finally {
      setIsSending(false);
    }
  }, [
    conversationId,
    draft,
    isSending,
    pendingAttachments,
    sendMessage,
    sendTyping,
  ]);

  const handleRetry = useCallback(
    async (clientMessageId: string) => {
      setError("");

      try {
        await retryMessage(clientMessageId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to retry this message.",
        );
      }
    },
    [retryMessage],
  );

  const handleAddAttachments = useCallback((files: PendingAttachment[]) => {
    setPendingAttachments((current) => [...current, ...files]);
  }, []);

  const handleRemoveAttachment = useCallback((id: string) => {
    setPendingAttachments((current) =>
      current.filter((attachment) => attachment.id !== id),
    );
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: MessagingMessage; index: number }) => {
      const isMine = item.sender_id === user?.id;
      const previous = messages[index - 1];

      const showDate =
        !previous || !sameDay(previous.created_at, item.created_at);

      return (
        <View>
          <MessageBubble
            item={item}
            isMine={isMine}
            showDate={showDate}
            dateLabel={formatDate(item.created_at)}
            timeLabel={formatTime(item.created_at)}
          />

          {isMine && item.delivery_status === "sending" && (
            <Text style={styles.deliveryLabel}>Sending…</Text>
          )}

          {isMine && item.delivery_status === "failed" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry sending message"
              onPress={() => {
                if (item.client_message_id) {
                  void handleRetry(item.client_message_id);
                }
              }}
              disabled={!item.client_message_id}
              style={styles.retryAction}
            >
              <Text style={styles.retryText}>
                Failed to send · Tap to retry
              </Text>
            </Pressable>
          )}
        </View>
      );
    },
    [handleRetry, messages, user?.id],
  );

  const statusLabel = useMemo(() => {
    if (isTyping) return "Typing…";

    switch (connectionStatus) {
      case "connected":
        return partnerOnline ? "Online" : "Connected";
      case "offline":
        return "Offline";
      case "reconnecting":
        return "Reconnecting…";
      default:
        return "Connecting…";
    }
  }, [connectionStatus, isTyping, partnerOnline]);

  const dotIsOnline =
    connectionStatus === "connected" && (partnerOnline || isTyping);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ChatHeader
          partnerName={partnerName}
          statusLabel={statusLabel}
          isOnline={dotIsOnline}
        />

        {!!visibleError && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss error"
            onPress={() => setError("")}
            style={styles.errorBanner}
          >
            <Text style={styles.errorBannerText}>{visibleError}</Text>
            <Text style={styles.dismissError}>×</Text>
          </Pressable>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Opening your conversation…</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.local_id ?? String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.messageList,
              messages.length === 0 && styles.emptyList,
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyHeartCircle}>
                  <Text style={styles.emptyHeart}>♥</Text>
                </View>
                <Text style={styles.emptyTitle}>
                  A little space for the two of you.
                </Text>
                <Text style={styles.emptyDescription}>
                  Send the first message and start your conversation.
                </Text>
              </View>
            }
            ListFooterComponent={
              isTyping ? <TypingIndicator partnerName={partnerName} /> : null
            }
          />
        )}

        <Composer
          draft={draft}
          onChangeDraft={setDraft}
          attachments={pendingAttachments}
          onAddAttachments={handleAddAttachments}
          onRemoveAttachment={handleRemoveAttachment}
          onSend={() => void handleSend()}
          onTypingChange={sendTyping}
          isSending={isSending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: "#FCEBED",
  },
  errorBannerText: {
    flex: 1,
    color: "#A52F42",
    fontSize: 12,
    lineHeight: 18,
  },
  dismissError: {
    color: "#A52F42",
    fontSize: 22,
    paddingLeft: spacing.md,
  },
  messageList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  emptyList: {
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyHeartCircle: {
    width: 76,
    height: 76,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  emptyHeart: {
    fontSize: 34,
    color: colors.primary,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  deliveryLabel: {
    alignSelf: "flex-end",
    marginRight: spacing.sm,
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 11,
  },
  retryAction: {
    alignSelf: "flex-end",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  retryText: {
    color: "#A52F42",
    fontSize: 12,
    fontWeight: "600",
  },
});
