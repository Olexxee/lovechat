import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

import AuthBackground from "../../components/AuthBackground";
import AuthField from "../../components/AuthField";
import PressableScale from "../../components/PressableScale";
import PulsingHeart from "../../components/PulsingHeart";
import { colors, radius, spacing, typography } from "../../constants/theme";
import { requestPasswordReset } from "../../services/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter the email address associated with your account.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request a reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthBackground />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.brand}>
            <PulsingHeart />
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>We’ll send you a link to choose a new password.</Text>
          </View>
          <View style={styles.form}>
            <AuthField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!isLoading} />
            {message ? <Text accessibilityRole="text" style={styles.success}>{message}</Text> : null}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <PressableScale style={[styles.button, isLoading && styles.disabled]} onPress={handleSubmit} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Send reset link</Text>}
            </PressableScale>
          </View>
          <View style={styles.footer}>
            <Link href="/auth/login" asChild>
              <Pressable><Text style={styles.link}>Back to sign in</Text></Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.xxl, paddingVertical: spacing.xxxl },
  brand: { alignItems: "center", marginBottom: spacing.huge },
  title: { marginTop: spacing.lg, fontSize: typography.heading, lineHeight: 38, fontWeight: "800", color: colors.text, textAlign: "center", letterSpacing: -0.8 },
  subtitle: { marginTop: spacing.sm, fontSize: typography.bodySmall, lineHeight: 22, color: colors.textSecondary, textAlign: "center" },
  form: { width: "100%" },
  button: { minHeight: 56, borderRadius: radius.round, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, marginTop: spacing.sm },
  disabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: typography.body, fontWeight: "800" },
  success: { marginBottom: spacing.md, color: colors.success, fontSize: typography.label, lineHeight: 20, textAlign: "center" },
  error: { marginBottom: spacing.md, color: colors.danger, fontSize: typography.label, lineHeight: 20, textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xxl },
  link: { fontSize: typography.label, fontWeight: "800", color: colors.primaryDark },
});
