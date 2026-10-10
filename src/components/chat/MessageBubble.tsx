import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import ImageAttachment from "./ImageAttachment";
import { Message } from "../../services/api";
import { colors, radius, spacing } from "../../constants/theme";

type Props = {
  item: Message;
  isMine: boolean;
  showDate: boolean;
  dateLabel: string;
  timeLabel: string;
};

export default function MessageBubble({
  item,
  isMine,
  showDate,
  dateLabel,
  timeLabel,
}: Props) {
  const appear = useRef(new Animated.Value(0)).current;

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
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myBubble : styles.theirBubble,
            !hasContent &&
              attachments.length > 0 &&
              styles.attachmentOnlyBubble,
          ]}
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
        </View>
      </Animated.View>
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
    backgroundColor: colors.primary,
    borderBottomRightRadius: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 2,
  },
  theirBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
});
