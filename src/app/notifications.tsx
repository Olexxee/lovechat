import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import PressableScale from "../components/PressableScale";
import { colors, radius, spacing, typography } from "../constants/theme";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../services/api";

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const result = await getNotifications();
      setItems(result.items);
      setUnreadCount(result.unread_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const markAll = async () => {
    if (busy || unreadCount === 0) return;
    setBusy(true);
    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update notifications.");
    } finally {
      setBusy(false);
    }
  };

  const openItem = async (item: AppNotification) => {
    if (!item.is_read) {
      try {
        await markNotificationRead(item.id);
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: true, read_at: new Date().toISOString() } : entry));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Opening the target remains useful even if marking read fails.
      }
    }
    const conversationId = Number(item.data?.conversation_id);
    if (Number.isInteger(conversationId) && conversationId > 0) {
      router.push({ pathname: "/chat/[conversationId]", params: { conversationId: String(conversationId) } });
    } else if (item.type === "relationship") {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <PressableScale style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </PressableScale>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>STAY IN THE LOOP</Text>
          <Text style={styles.title}>Notifications</Text>
        </View>
        <View style={styles.unreadPill}><Text style={styles.unreadPillText}>{unreadCount}</Text></View>
      </View>
      <View style={styles.toolbar}>
        <Text style={styles.sectionTitle}>Recent activity</Text>
        <PressableScale onPress={() => void markAll()} disabled={busy || unreadCount === 0} style={styles.markAll}>
          {busy ? <ActivityIndicator size="small" color={colors.primaryDark} /> : <Text style={[styles.markAllText, unreadCount === 0 && styles.disabledText]}>Mark all read</Text>}
        </PressableScale>
      </View>
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
      >
        {error ? (
          <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text><PressableScale onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></PressableScale></View>
        ) : null}
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.muted}>Loading notifications…</Text></View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name="notifications-outline" size={30} color={colors.primaryDark} /></View>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptyText}>Connection requests and new messages will show up here.</Text>
          </View>
        ) : items.map((item) => (
          <PressableScale key={item.id} onPress={() => void openItem(item)} style={[styles.card, !item.is_read && styles.unreadCard]}>
            <View style={[styles.iconWrap, item.type === "message" ? styles.messageIcon : styles.relationshipIcon]}>
              <Ionicons name={item.type === "message" ? "chatbubble-ellipses" : "heart"} size={20} color={colors.primaryDark} />
            </View>
            <View style={styles.copy}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {!item.is_read ? <View style={styles.dot} /> : null}
              </View>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{relativeTime(item.created_at)}</Text>
            </View>
          </PressableScale>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  backButton: { width: 42, height: 42, borderRadius: radius.round, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.primaryDark, fontSize: 9, fontWeight: "800", letterSpacing: 1.5, marginBottom: 4 },
  title: { color: colors.text, fontSize: typography.heading, lineHeight: 36, fontWeight: "800", letterSpacing: -0.8 },
  unreadPill: { minWidth: 34, height: 34, borderRadius: radius.round, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  unreadPillText: { color: colors.primaryDark, fontSize: 13, fontWeight: "800" },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  markAll: { minHeight: 36, justifyContent: "center", paddingHorizontal: spacing.sm },
  markAllText: { color: colors.primaryDark, fontSize: 12, fontWeight: "800" },
  disabledText: { color: colors.textMuted },
  list: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.sm },
  card: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  unreadCard: { backgroundColor: "#FFF9F8", borderWidth: 1, borderColor: colors.primarySoft },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  messageIcon: { backgroundColor: colors.surfaceSoft },
  relationshipIcon: { backgroundColor: "#F8E8EB" },
  copy: { flex: 1, gap: 5 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: "800" },
  dot: { width: 8, height: 8, borderRadius: radius.round, backgroundColor: colors.primary },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  time: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 70, gap: spacing.md },
  muted: { color: colors.textSecondary, fontSize: 13 },
  empty: { alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xxl, paddingVertical: 70 },
  emptyIcon: { width: 66, height: 66, borderRadius: radius.round, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 19, fontWeight: "800", marginBottom: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: "center" },
  errorCard: { padding: spacing.md, backgroundColor: "#FBEAEC", borderRadius: radius.md },
  errorText: { color: colors.danger, fontSize: 13 },
  retry: { alignSelf: "flex-start", paddingVertical: spacing.sm },
  retryText: { color: colors.primaryDark, fontSize: 13, fontWeight: "800" },
});
