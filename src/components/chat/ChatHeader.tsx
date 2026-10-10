import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import PressableScale from "../PressableScale";
import Reveal from "../Reveal";
import { colors, radius, spacing } from "../../constants/theme";

type Props = {
  partnerName: string;
  statusLabel: string;
  isOnline: boolean;
};

export default function ChatHeader({
  partnerName,
  statusLabel,
  isOnline,
}: Props) {
  const router = useRouter();

  return (
    <Reveal duration={320} style={styles.header}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Text style={styles.backArrow}>‹</Text>
      </PressableScale>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {partnerName.charAt(0).toUpperCase()}
        </Text>
        <View
          style={[
            styles.onlineDot,
            isOnline ? styles.dotOnline : styles.dotOffline,
          ]}
        />
      </View>

      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>
          {partnerName}
        </Text>
        <Text style={styles.status}>{statusLabel}</Text>
      </View>
    </Reveal>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    width: 34,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 36,
    lineHeight: 40,
    color: colors.text,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  dotOnline: { backgroundColor: "#32A878" },
  dotOffline: { backgroundColor: colors.textMuted },
  info: { flex: 1, gap: 3 },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  status: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
