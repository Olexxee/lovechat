import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import PressableScale from "../../components/PressableScale";
import Reveal from "../../components/Reveal";
import { getRelationships, Relationship } from "../../services/api";
import { colors, radius, spacing, typography } from "../../constants/theme";

export default function MessagesScreen() {
  const router = useRouter();

  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    setError("");

    try {
      setRelationships(await getRelationships());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load conversations.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const conversations = relationships.filter(
    (relationship) => relationship.status === "ACTIVE",
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.primary}
          />
        }
      >
        <Reveal>
          <Text style={styles.eyebrow}>INBOX</Text>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Pick up where you left off.</Text>
        </Reveal>

        <View style={styles.spacer} />

        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>Loading conversations...</Text>
          </View>
        ) : error ? (
          <Reveal style={styles.stateCard}>
            <Text style={styles.stateTitle}>Something went wrong</Text>
            <Text style={styles.stateText}>{error}</Text>
            <PressableScale
              style={styles.retryButton}
              onPress={() => void load()}
            >
              <Text style={styles.retryText}>Try again</Text>
            </PressableScale>
          </Reveal>
        ) : conversations.length === 0 ? (
          <Reveal style={styles.emptyCard}>
            <Text style={styles.emptyHeart}>♡</Text>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              Once you have a relationship, your conversations will appear here.
            </Text>
          </Reveal>
        ) : (
          <View style={styles.list}>
            {conversations.map((relationship, index) => (
              <Reveal key={relationship.id} delay={80 + index * 70}>
                <PressableScale
                  style={styles.row}
                  onPress={() =>
                    router.push({
                      pathname: "/chat/[conversationId]",
                      params: {
                        conversationId: String(relationship.conversation_id),
                      },
                    } as any)
                  }
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {relationship.partner.name.charAt(0).toUpperCase()}
                    </Text>
                    <View style={styles.onlineDot} />
                  </View>

                  <View style={styles.rowInfo}>
                    <Text style={styles.partnerName}>
                      {relationship.partner.name}
                    </Text>
                    <Text style={styles.preview} numberOfLines={1}>
                      Tap to open your private conversation
                    </Text>
                  </View>

                  <Text style={styles.chevron}>›</Text>
                </PressableScale>
              </Reveal>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
  },
  spacer: { height: spacing.xl },
  stateContainer: {
    paddingVertical: spacing.huge,
    alignItems: "center",
    gap: spacing.md,
  },
  stateCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  stateTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  stateText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
  },
  retryText: { color: colors.primaryDark, fontWeight: "700" },
  emptyCard: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyHeart: {
    fontSize: 48,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: 19, fontWeight: "800", color: colors.text },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: { gap: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  avatarText: { color: colors.primaryDark, fontSize: 21, fontWeight: "800" },
  onlineDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  rowInfo: { flex: 1, marginLeft: spacing.md },
  partnerName: { color: colors.text, fontSize: 16, fontWeight: "800" },
  preview: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 13,
  },
  chevron: {
    color: colors.primary,
    fontSize: 30,
    lineHeight: 32,
    marginLeft: spacing.sm,
  },
});
