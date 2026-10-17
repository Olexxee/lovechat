import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import PressableScale from "../PressableScale";
import { colors, radius, spacing } from "../../constants/theme";
import type { Message } from "../../services/api";

export type PendingAttachment = {
  id: string;
  uri: string;
  filename: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
};

type Props = {
  draft: string;
  onChangeDraft: (value: string) => void;
  attachments: PendingAttachment[];
  onAddAttachments: (files: PendingAttachment[]) => void;
  onRemoveAttachment: (id: string) => void;
  onSend: () => void;
  onTypingChange: (isTyping: boolean) => void;
  isSending: boolean;
  maxAttachments?: number;
  replyingTo: Message | null;
  onCancelReply: () => void;
};

export default function Composer({
  draft,
  onChangeDraft,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  onSend,
  onTypingChange,
  isSending,
  maxAttachments = 5,
  replyingTo,
  onCancelReply,
}: Props) {
  const canSend =
    !isSending && (draft.trim().length > 0 || attachments.length > 0);

  const pickImages = useCallback(async () => {
    const remaining = maxAttachments - attachments.length;

    if (remaining <= 0) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const files: PendingAttachment[] = result.assets.map((asset) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      uri: asset.uri,
      filename: asset.fileName ?? `photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? "image/jpeg",
      width: asset.width,
      height: asset.height,
    }));

    onAddAttachments(files);
  }, [attachments.length, maxAttachments, onAddAttachments]);

  const handleChangeText = useCallback(
    (value: string) => {
      onChangeDraft(value);
      onTypingChange(value.trim().length > 0);
    },
    [onChangeDraft, onTypingChange],
  );

  const replyPreviewText = replyingTo
    ? replyingTo.deleted_at
      ? "This message was deleted"
      : replyingTo.content.trim() ||
        (replyingTo.attachments.length > 0 ? "Photo attachment" : "Message")
    : "";

  return (
    <View style={styles.area}>
      {replyingTo && (
        <View style={styles.replyPreview}>
          <View style={styles.replyAccent} />

          <View style={styles.replyContent}>
            <Text style={styles.replyTitle}>Replying to message</Text>
            <Text numberOfLines={2} style={styles.replyText}>
              {replyPreviewText}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
            onPress={onCancelReply}
            hitSlop={8}
            style={styles.cancelReplyButton}
          >
            <Text style={styles.cancelReplyText}>×</Text>
          </Pressable>
        </View>
      )}

      {attachments.length > 0 && (
        <View style={styles.previewRow}>
          {attachments.map((attachment) => (
            <View key={attachment.id} style={styles.preview}>
              <Image
                source={{ uri: attachment.uri }}
                style={styles.previewImage}
              />

              <Pressable
                onPress={() => onRemoveAttachment(attachment.id)}
                style={styles.removeButton}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Remove attachment"
              >
                <Text style={styles.removeText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.composer}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Attach image"
          onPress={pickImages}
          disabled={isSending || attachments.length >= maxAttachments}
          style={[
            styles.attachButton,
            (isSending || attachments.length >= maxAttachments) &&
              styles.attachButtonDisabled,
          ]}
        >
          <Text style={styles.attachIcon}>+</Text>
        </PressableScale>

        <TextInput
          value={draft}
          onChangeText={handleChangeText}
          placeholder="Write a message..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={5000}
          style={styles.input}
          editable={!isSending}
          accessibilityLabel="Message"
        />

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={!canSend}
          onPress={onSend}
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </PressableScale>
      </View>

      <Text style={styles.hint}>
        {attachments.length > 0
          ? `${attachments.length} of ${maxAttachments} image${
              attachments.length === 1 ? "" : "s"
            } attached`
          : "A private conversation, just for you two."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, backgroundColor: colors.background },
  replyPreview: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceSoft },
  replyAccent: { width: 3, alignSelf: "stretch", borderRadius: 2, backgroundColor: colors.primary, marginRight: spacing.sm },
  replyContent: { flex: 1, gap: 2 },
  replyTitle: { color: colors.primaryDark, fontSize: 12, fontWeight: "800" },
  replyText: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  cancelReplyButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center", marginLeft: spacing.sm },
  cancelReplyText: { color: colors.textMuted, fontSize: 24, lineHeight: 26 },
  previewRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  preview: { width: 64, height: 64, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.surfaceSoft },
  previewImage: { width: "100%", height: "100%" },
  removeButton: { position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: radius.round, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  removeText: { color: colors.white, fontSize: 16, lineHeight: 18, fontWeight: "800" },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, padding: spacing.xs, borderRadius: radius.xl, backgroundColor: colors.surface },
  attachButton: { width: 42, height: 42, borderRadius: radius.round, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSoft, marginBottom: 1 },
  attachButtonDisabled: { opacity: 0.4 },
  attachIcon: { color: colors.primaryDark, fontSize: 24, lineHeight: 26, fontWeight: "800" },
  input: { flex: 1, maxHeight: 120, minHeight: 42, paddingTop: spacing.md, paddingBottom: spacing.md, paddingHorizontal: spacing.sm, color: colors.text, fontSize: 15, lineHeight: 21 },
  sendButton: { width: 42, height: 42, borderRadius: radius.round, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 1 },
  sendButtonDisabled: { opacity: 0.45 },
  sendIcon: { color: colors.white, fontSize: 25, lineHeight: 28, fontWeight: "700" },
  hint: { color: colors.textMuted, fontSize: 10, textAlign: "center", marginTop: spacing.sm },
});
