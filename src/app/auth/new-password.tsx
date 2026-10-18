import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useLocalSearchParams } from "expo-router";
import AuthBackground from "../../components/AuthBackground";
import AuthField from "../../components/AuthField";
import PressableScale from "../../components/PressableScale";
import PulsingHeart from "../../components/PulsingHeart";
import { colors, radius, spacing, typography } from "../../constants/theme";
import { confirmPasswordReset } from "../../services/api";

export default function NewPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setError(""); setSuccess("");
    if (!token) return setError("This link is incomplete. Request a new email.");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The passwords do not match.");
    setLoading(true);
    try { setSuccess((await confirmPasswordReset(token, password)).message); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update password."); }
    finally { setLoading(false); }
  };
  return <SafeAreaView style={styles.safe}>
    <AuthBackground />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}><PulsingHeart /><Text style={styles.title}>Choose a new password</Text><Text style={styles.subtitle}>Secure your LoveChat account.</Text></View>
        <AuthField label="New password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!loading} />
        <AuthField label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Enter it again" secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!loading} />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        {!success ? <PressableScale style={[styles.button, loading && styles.disabled]} onPress={submit} disabled={loading}>{loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Update password</Text>}</PressableScale> : <Link href="/auth/login" style={styles.link}>Return to sign in</Link>}
        <View style={styles.footer}><Link href="/auth/forgot-password" style={styles.link}>Request another link</Link></View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.xxl, paddingVertical: spacing.xxxl },
  brand: { alignItems: "center", marginBottom: spacing.huge },
  title: { marginTop: spacing.lg, fontSize: typography.heading, lineHeight: 38, fontWeight: "800", color: colors.text, textAlign: "center" },
  subtitle: { marginTop: spacing.sm, fontSize: typography.bodySmall, lineHeight: 22, color: colors.textSecondary, textAlign: "center" },
  button: { minHeight: 56, borderRadius: radius.round, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, marginTop: spacing.sm },
  disabled: { opacity: 0.7 }, buttonText: { color: colors.white, fontSize: typography.body, fontWeight: "800" },
  error: { marginBottom: spacing.md, color: colors.danger, textAlign: "center" }, success: { marginBottom: spacing.md, color: colors.success, textAlign: "center" },
  footer: { alignItems: "center", marginTop: spacing.xxl }, link: { fontSize: typography.label, fontWeight: "800", color: colors.primaryDark, textAlign: "center" }
});