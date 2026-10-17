import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import PressableScale from "../../components/PressableScale";
import AvatarPicker from "../../features/profile/components/AvatarPicker";
import { useAuth } from "../../context/AuthContext";
import { colors, radius, spacing, typography } from "../../constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await logout();
      router.replace("/auth/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  const initials = (user?.name || "You").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR SPACE</Text>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>A little about the person behind the messages.</Text>

        <View style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            <AvatarPicker avatarUrl={user?.avatar_url} />
            <View style={styles.avatarSparkle}><Text style={styles.sparkle}>✦</Text></View>
          </View>
          <Text style={styles.name}>{user?.name || "You"}</Text>
          <Text style={styles.email}>{user?.email || ""}</Text>
          <View style={styles.privatePill}><View style={styles.privateDot} /><Text style={styles.privateText}>Your account is private</Text></View>
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT DETAILS</Text>
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><Text style={styles.detailIconText}>A</Text></View>
            <View style={styles.detailCopy}><Text style={styles.rowLabel}>Display name</Text><Text style={styles.rowValue}>{user?.name || "Not set"}</Text></View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><Text style={styles.detailIconText}>@</Text></View>
            <View style={styles.detailCopy}><Text style={styles.rowLabel}>Email address</Text><Text style={styles.rowValue}>{user?.email || "Not set"}</Text></View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceIcon}><Text style={styles.preferenceIconText}>♡</Text></View>
          <View style={styles.preferenceCopy}><Text style={styles.preferenceTitle}>Private by design</Text><Text style={styles.preferenceText}>Your conversations are just for the two of you.</Text></View>
          <Text style={styles.preferenceArrow}>✓</Text>
        </View>

        <PressableScale style={styles.logoutButton} onPress={() => void handleLogout()} disabled={isSigningOut}>
          {isSigningOut ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.logoutText}>Sign out</Text>}
        </PressableScale>
        <Text style={styles.footer}>LoveChat · Made for meaningful connections</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },
  eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: "800", letterSpacing: 1.8, marginBottom: spacing.sm },
  title: { fontSize: typography.title, fontWeight: "800", color: colors.text, letterSpacing: -1.2 },
  subtitle: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  profileHero: { alignItems: "center", paddingTop: 34, paddingBottom: 36 },
  avatarWrap: { position: "relative", marginBottom: spacing.md },
  avatarSparkle: { position: "absolute", right: -3, bottom: 2, width: 26, height: 26, borderRadius: radius.round, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.background, alignItems: "center", justifyContent: "center" },
  sparkle: { color: colors.white, fontSize: 11 },
  name: { color: colors.text, fontSize: 25, fontWeight: "800", letterSpacing: -0.6 },
  email: { marginTop: 5, color: colors.textSecondary, fontSize: 14 },
  privatePill: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.round, backgroundColor: colors.surfaceSoft },
  privateDot: { width: 6, height: 6, borderRadius: radius.round, backgroundColor: colors.success },
  privateText: { color: colors.primaryDark, fontSize: 11, fontWeight: "700" },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginBottom: spacing.sm, marginTop: spacing.md },
  details: { paddingHorizontal: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  detailRow: { flexDirection: "row", alignItems: "center", minHeight: 78, gap: spacing.md },
  detailIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  detailIconText: { color: colors.primaryDark, fontSize: 16, fontWeight: "800" },
  detailCopy: { flex: 1, gap: 5 },
  rowLabel: { color: colors.textMuted, fontSize: 12 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginLeft: 50 },
  preferenceRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  preferenceIcon: { width: 42, height: 42, borderRadius: radius.round, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  preferenceIconText: { color: colors.primary, fontSize: 24 },
  preferenceCopy: { flex: 1, gap: 4 },
  preferenceTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  preferenceText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  preferenceArrow: { color: colors.success, fontSize: 17, fontWeight: "800" },
  logoutButton: { minHeight: 52, marginTop: spacing.xl, borderRadius: radius.round, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  logoutText: { color: colors.danger, fontSize: 14, fontWeight: "800" },
  footer: { marginTop: spacing.xxl, textAlign: "center", color: colors.textMuted, fontSize: 11 },
});
