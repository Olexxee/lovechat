import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ImageAttachment from "./ImageAttachment";
import type { Message } from "../../services/api";
import { colors, radius, spacing } from "../../constants/theme";

type Props = {
  item: Message;
  isMine: boolean;
  showDate: boolean;
  dateLabel: string;
  timeLabel: string;
  onReply: (message: Message) => void;
  onDelete: (message: Message) => void;
};

function getMessagePreview(message: Message): string {
  if (message.deleted_at) {
    return "This message was deleted";
  }

  const content = message.content?.trim();

  if (content) {
    return content;
  }

  if ((message.attachments ?? []).length > 0) {
    return "Photo attachment";
  }

  return "Message";
}

export default function MessageBubble({
  item,
  isMine,
  showDate,
  dateLabel,
  timeLabel,
  onReply,
  onDelete,
}: Props) {
  const appear = useRef(new Animated.Value(0)).current;
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    Animated.spring(appear, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    }).start();
  }, [appear]);

  const translateY = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const hasContent = !item.deleted_at && !!item.content?.trim();
  const attachments = item.deleted_at ? [] : (item.attachments ?? []);
  const replyPreview = item.reply_to;

  const canReply = !item.deleted_at;
  const canDelete = isMine && !item.deleted_at;

  const closeMenu = () => setMenuVisible(false);

  const handleReply = () => {
    closeMenu();
    onReply(item);
  };

  const handleDelete = () => {
    closeMenu();
    onDelete(item);
  };

  return (
    <View>
      {showDate && (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateText}>{dateLabel}</Text>
        </View>
      )}

      <Animated.View
        style={[
          styles.messageRow,
          isMine ? styles.myMessageRow : styles.theirMessageRow,
          { opacity: appear, transform: [{ translateY }] },
        ]}
      >
        <Pressable
          delayLongPress={300}
          onLongPress={() => setMenuVisible(true)}
          style={[
            styles.messageBubble,
            isMine ? styles.myBubble : styles.theirBubble,
            !hasContent &&
              attachments.length > 0 &&
              styles.attachmentOnlyBubble,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            `${isMine ? "Your message" : "Message received"}. ` +
            getMessagePreview(item)
          }
          accessibilityHint="Long press for message actions"
        >
          {item.deleted_at ? (
            <Text
              style={[
                styles.messageText,
                isMine && styles.myMessageText,
                styles.deletedText,
              ]}
            >
              This message was deleted.
            </Text>
          ) : (
            <>
              {replyPreview && (
                <View
                  style={[
                    styles.replyPreview,
                    isMine
                      ? styles.myReplyPreview
                      : styles.theirReplyPreview,
                  ]}
                >
                  <Text
                    style={[
                      styles.replyAuthor,
                      isMine && styles.myReplyAuthor,
                    ]}
                    numberOfLines={1}
                  >
                    {replyPreview.sender_name ?? "Message"}
                  </Text>

                  <Text
                    style={[
                      styles.replyText,
                      isMine && styles.myReplyText,
                    ]}
                    numberOfLines={2}
                  >
                    {replyPreview.deleted_at
                      ? "This message was deleted"
                      : replyPreview.content?.trim() ||
                        (replyPreview.attachments?.length
                          ? "Photo attachment"
                          : "Message")}
                  </Text>
                </View>
              )}

              {attachments.length > 0 && (
                <View style={styles.attachments}>
                  {attachments.map((attachment) => (
                    <ImageAttachment
                      key={attachment.id}
                      uri={attachment.secure_url}
                      width={attachment.width}
                      height={attachment.height}
                      isMine={isMine}
                    />
                  ))}
                </View>
              )}

              {hasContent && (
                <Text
                  style={[
                    styles.messageText,
                    isMine && styles.myMessageText,
                    attachments.length > 0 && styles.textAfterImage,
                  ]}
                >
                  {item.content}
                </Text>
              )}
            </>
          )}

          <View style={styles.messageMeta}>
            <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
              {timeLabel}
            </Text>

            {isMine && !item.deleted_at && (
              <Text
                style={[styles.receipt, item.read_at && styles.readReceipt]}
              >
                {item.read_at ? "✓✓" : "✓"}
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuBackdrop} onPress={closeMenu}>
          <Pressable
            style={styles.actionMenu}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.menuHeading}>Message actions</Text>

            {canReply && (
              <Pressable
                style={styles.menuAction}
                onPress={handleReply}
              >
                <Text style={styles.menuActionText}>Reply</Text>
              </Pressable>
            )}

            {canDelete && (
              <Pressable
                style={styles.menuAction}
                onPress={handleDelete}
              >
                <Text style={styles.deleteActionText}>Delete message</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.menuAction, styles.cancelAction]}
              onPress={closeMenu}
            >
              <Text style={styles.menuActionText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dateSeparator: {
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginVertical: spacing.md,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceSoft,
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  myMessageRow: { justifyContent: "flex-end" },
  theirMessageRow: { justifyContent: "flex-start" },
  messageBubble: {
    maxWidth: "84%",
    minWidth: 76,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderRadius: radius.xl,
  },
  attachmentOnlyBubble: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  myBubble: {
    backgroundColor: colors.primaryDark,
    borderBottomRightRadius: 5,
  },
  theirBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 5,
  },
  attachments: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  messageText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: spacing.xs,
  },
  textAfterImage: {
    marginTop: spacing.xs,
  },
  myMessageText: {
    color: colors.white,
  },
  deletedText: {
    fontStyle: "italic",
    opacity: 0.8,
  },
  replyPreview: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  myReplyPreview: {
    borderLeftColor: "#FBE4E8",
    backgroundColor: "rgba(0, 0, 0, 0.12)",
  },
  theirReplyPreview: {
    borderLeftColor: colors.primary,
    backgroundColor: colors.surfaceSoft,
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primaryDark,
    marginBottom: 2,
  },
  myReplyAuthor: {
    color: "#FFFFFF",
  },
  replyText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  myReplyText: {
    color: "#FBE4E8",
  },
  messageMeta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 5,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  messageTime: {
    color: colors.textMuted,
    fontSize: 10,
  },
  myMessageTime: { color: "#FBE4E8" },
  receipt: {
    color: "#FBE4E8",
    fontSize: 11,
    fontWeight: "800",
  },
  readReceipt: { color: "#D9F2FF" },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  actionMenu: {
    width: "100%",
    maxWidth: 320,
    padding: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuAction: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  menuActionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  deleteActionText: {
    color: "#D9364F",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelAction: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
});