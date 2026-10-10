import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import PressableScale from "../../components/PressableScale";
import Reveal from "../../components/Reveal";
import AvatarPicker from "../../features/profile/components/AvatarPicker";
import { useAuth } from "../../context/AuthContext";
import { colors, radius, spacing, typography } from "../../constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace("/auth/login");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal style={styles.hero}>
          <AvatarPicker avatarUrl={user?.avatar_url} />

          <Text style={styles.name}>{user?.name || "You"}</Text>
          <Text style={styles.email}>{user?.email || ""}</Text>
        </Reveal>

        <Reveal delay={120} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{user?.name || "—"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{user?.email || "—"}</Text>
          </View>
        </Reveal>

        <Reveal delay={200}>
          <PressableScale
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Sign out</Text>
          </PressableScale>
        </Reveal>

        <Reveal delay={280} style={styles.footer}>
          <Text style={styles.footerText}>
            LoveChat · just the two of us
          </Text>
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  name: {
    marginTop: spacing.sm,
    fontSize: typography.heading,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.6,
  },
  email: {
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
  },
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  rowLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  rowValue: {
    flexShrink: 1,
    marginLeft: spacing.md,
    fontSize: 14,
    color: colors.text,
    fontWeight: "700",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  logoutButton: {
    marginTop: spacing.xxl,
    height: 54,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: "800",
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.xxl,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
