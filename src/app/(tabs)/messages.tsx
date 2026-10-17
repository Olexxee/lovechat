import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import PressableScale from "../../components/PressableScale";
import { getRelationships, type Relationship } from "../../services/api";
import { colors, radius, spacing, typography } from "../../constants/theme";

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function MessagesScreen() {
  const router = useRouter();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError("");
    try {
      setRelationships(await getRelationships());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load conversations.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const conversations = relationships.filter((item) => item.status === "ACTIVE" && item.conversation_id);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>YOUR PRIVATE SPACE</Text>
            <Text style={styles.title}>Messages</Text>
            <Text style={styles.subtitle}>Little moments, shared between two.</Text>
          </View>
          <PressableScale accessibilityRole="button" accessibilityLabel="Create a connection" style={styles.addButton} onPress={() => router.push("/relationships/new")}>
            <Text style={styles.addButtonText}>＋</Text>
          </PressableScale>
        </View>

        {isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>Opening your private space…</Text>
          </View>
        ) : error ? (
          <View style={styles.state}>
            <Text style={styles.stateIcon}>♡</Text>
            <Text style={styles.stateTitle}>We couldn't load your messages</Text>
            <Text style={styles.stateText}>{error}</Text>
            <PressableScale style={styles.retryButton} onPress={() => void load()}>
              <Text style={styles.retryText}>Try again</Text>
            </PressableScale>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <Text style={styles.emptyHeart}>♡</Text>
              <View style={styles.smallSparkle}><Text style={styles.sparkleText}>✦</Text></View>
            </View>
            <Text style={styles.emptyTitle}>Your story starts with a connection.</Text>
            <Text style={styles.emptyText}>When someone accepts your invitation, your private conversation will be waiting here.</Text>
            <PressableScale style={styles.primaryButton} onPress={() => router.push("/relationships/new")}>
              <Text style={styles.primaryButtonText}>Invite someone</Text>
            </PressableScale>
          </View>
        ) : (
          <View style={styles.list}>
            <Text style={styles.sectionLabel}>YOUR CONVERSATIONS <Text style={styles.count}>{conversations.length}</Text></Text>
            {conversations.map((relationship) => (
              <PressableScale
                key={relationship.id}
                style={styles.row}
                onPress={() => router.push({ pathname: "/chat/[conversationId]", params: { conversationId: String(relationship.conversation_id) } })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(relationship.partner.name)}</Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.partnerName} numberOfLines={1}>{relationship.partner.name}</Text>
                  <Text style={styles.preview} numberOfLines={1}>Your private conversation</Text>
                </View>
                <View style={styles.rowTrailing}>
                  <View style={styles.privateDot} />
                  <Text style={styles.chevron}>›</Text>
                </View>
              </PressableScale>
            ))}
          </View>
        )}
        <Text style={styles.footer}>A little more close. A little less noise.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xxxl },
  headerCopy: { flex: 1, paddingRight: spacing.md },
  eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: "800", letterSpacing: 1.8, marginBottom: spacing.sm },
  title: { fontSize: typography.title, fontWeight: "800", color: colors.text, letterSpacing: -1.2 },
  subtitle: { marginTop: spacing.xs, fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  addButton: { width: 48, height: 48, borderRadius: radius.round, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", shadowColor: colors.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 3 },
  addButtonText: { color: colors.white, fontSize: 28, lineHeight: 31, fontWeight: "400", marginTop: -2 },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: spacing.sm },
  count: { color: colors.primaryDark, letterSpacing: 0 },
  list: { gap: 0 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 86, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  avatar: { width: 54, height: 54, borderRadius: radius.round, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSoft },
  avatarText: { color: colors.primaryDark, fontSize: 18, fontWeight: "800" },
  rowInfo: { flex: 1, marginLeft: spacing.md },
  partnerName: { color: colors.text, fontSize: 16, fontWeight: "700" },
  preview: { marginTop: 5, color: colors.textSecondary, fontSize: 13 },
  rowTrailing: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  privateDot: { width: 7, height: 7, borderRadius: radius.round, backgroundColor: colors.success },
  chevron: { color: colors.textMuted, fontSize: 28, lineHeight: 30 },
  state: { alignItems: "center", paddingTop: 70, paddingHorizontal: spacing.xl, gap: spacing.md },
  stateIcon: { fontSize: 44, color: colors.primary },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: "800", textAlign: "center" },
  stateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: "center" },
  retryButton: { marginTop: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.round, backgroundColor: colors.surfaceSoft },
  retryText: { color: colors.primaryDark, fontWeight: "800" },
  emptyState: { alignItems: "center", paddingTop: 28, paddingHorizontal: spacing.md },
  emptyIllustration: { width: 124, height: 124, borderRadius: radius.round, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  emptyHeart: { color: colors.primary, fontSize: 70, lineHeight: 78 },
  smallSparkle: { position: "absolute", top: 15, right: 15, width: 25, height: 25, borderRadius: radius.round, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  sparkleText: { color: colors.primaryDark, fontSize: 13 },
  emptyTitle: { color: colors.text, fontSize: 22, lineHeight: 29, fontWeight: "800", letterSpacing: -0.5, textAlign: "center", maxWidth: 280 },
  emptyText: { marginTop: spacing.md, color: colors.textSecondary, fontSize: 14, lineHeight: 22, textAlign: "center", maxWidth: 300 },
  primaryButton: { marginTop: spacing.xl, minHeight: 52, paddingHorizontal: spacing.xxl, borderRadius: radius.round, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: "800" },
  footer: { marginTop: "auto", paddingTop: 56, textAlign: "center", color: colors.textMuted, fontSize: 11, letterSpacing: 0.4 },
});
