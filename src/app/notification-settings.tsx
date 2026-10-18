import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import PressableScale from "../components/PressableScale";
import { colors, radius, spacing, typography } from "../constants/theme";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "../services/api";

const defaults: NotificationPreferences = {
  push_enabled: true,
  message_notifications: true,
  relationship_notifications: true,
};

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<keyof NotificationPreferences | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPreferences(await getNotificationPreferences());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load notification preferences.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const update = async (key: keyof NotificationPreferences, value: boolean) => {
    const previous = preferences[key];
    setPreferences((current) => ({ ...current, [key]: value }));
    setSaving(key);
    setError("");
    try {
      const updated = await updateNotificationPreferences({ [key]: value });
      setPreferences(updated);
    } catch (err) {
      setPreferences((current) => ({ ...current, [key]: previous }));
      setError(err instanceof Error ? err.message : "Couldn't save this setting.");
    } finally {
      setSaving(null);
    }
  };

  const row = (key: keyof NotificationPreferences, title: string, description: string) => (
    <View style={styles.row} key={key}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      {saving === key ? <ActivityIndicator size="small" color={colors.primary} /> : (
        <Switch
          value={preferences[key]}
          onValueChange={(value) => void update(key, value)}
          disabled={loading || saving !== null}
          trackColor={{ false: colors.border, true: colors.primarySoft }}
          thumbColor={preferences[key] ? colors.primary : "#F5F5F5"}
          accessibilityLabel={title}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <PressableScale style={styles.back} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </PressableScale>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>MAKE IT YOURS</Text>
          <Text style={styles.title}>Notifications</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introIcon}><Ionicons name="notifications-outline" size={27} color={colors.primaryDark} /></View>
        <Text style={styles.introTitle}>Choose what reaches you</Text>
        <Text style={styles.introText}>Keep important moments close while staying in control of your alerts.</Text>
        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><PressableScale onPress={() => void load()}><Text style={styles.retry}>Try again</Text></PressableScale></View> : null}
        {loading ? <ActivityIndicator style={styles.loader} size="large" color={colors.primary} /> : (
          <View style={styles.card}>
            {row("push_enabled", "Push notifications", "Allow LoveChat to send alerts to this device.")}
            <View style={styles.divider} />
            {row("message_notifications", "Message push alerts", "Allow push alerts when your connection sends a message.")}
            <View style={styles.divider} />
            {row("relationship_notifications", "Connection push alerts", "Allow push alerts for requests and connection updates.")}
          </View>
        )}
        <Text style={styles.note}>Your in-app notification inbox remains available even when push notifications are turned off.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  back: { width: 42, height: 42, borderRadius: radius.round, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.primaryDark, fontSize: 9, fontWeight: "800", letterSpacing: 1.5, marginBottom: 4 },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: "800", letterSpacing: -0.8 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  introIcon: { width: 58, height: 58, borderRadius: radius.lg, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center", marginTop: spacing.sm, marginBottom: spacing.lg },
  introTitle: { color: colors.text, fontSize: 23, fontWeight: "800", letterSpacing: -0.5 },
  introText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: spacing.sm, marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, paddingHorizontal: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", minHeight: 86, gap: spacing.md, paddingVertical: spacing.md },
  rowCopy: { flex: 1, gap: 5 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  rowDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  loader: { marginTop: spacing.xxxl },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: spacing.lg, paddingHorizontal: spacing.xs },
  errorBox: { backgroundColor: "#FBEAEC", borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  errorText: { color: colors.danger, fontSize: 12 },
  retry: { color: colors.primaryDark, fontWeight: "800", marginTop: spacing.sm },
});
