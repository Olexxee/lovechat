import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";

import AuthBackground from "../../components/AuthBackground";
import AuthField from "../../components/AuthField";
import PressableScale from "../../components/PressableScale";
import PulsingHeart from "../../components/PulsingHeart";
import Reveal from "../../components/Reveal";
import { colors, radius, spacing, typography } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const shake = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, {
        toValue: 1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: -1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0.6,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const translateX = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-9, 9],
  });

  const handleLogin = async () => {
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email.");
      triggerShake();
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      await login({ email: normalizedEmail, password });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthBackground />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Reveal style={styles.brandSection}>
            <PulsingHeart />
            <Text style={styles.title}>LoveChat</Text>
            <Text style={styles.subtitle}>Just the two of us.</Text>
          </Reveal>

          <Animated.View style={[styles.form, { transform: [{ translateX }] }]}>
            <Reveal delay={140}>
              <AuthField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </Reveal>

            <Reveal delay={220}>
              <AuthField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                rightAccessory={
                  <Pressable
                    hitSlop={10}
                    onPress={() => setShowPassword((value) => !value)}
                  >
                    <Text style={styles.toggle}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                }
              />
            </Reveal>

            <View style={styles.forgotRow}>
              <Link href="/auth/forgot-password" asChild>
                <Pressable disabled={isLoading}>
                  <Text style={styles.link}>Forgot password?</Text>
                </Pressable>
              </Link>
            </View>

            {error ? (
              <Reveal duration={260}>
                <Text style={styles.error}>{error}</Text>
              </Reveal>
            ) : null}

            <Reveal delay={300}>
              <PressableScale
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Sign in</Text>
                )}
              </PressableScale>
            </Reveal>
          </Animated.View>

          <Reveal delay={380} style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Link href="/auth/register" asChild>
              <Pressable disabled={isLoading}>
                <Text style={styles.link}>Create one</Text>
              </Pressable>
            </Link>
          </Reveal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.xxl, paddingVertical: spacing.xxxl },
  brandSection: { alignItems: "center", marginBottom: spacing.huge },
  title: { marginTop: spacing.lg, fontSize: typography.title, lineHeight: 40, fontWeight: "800", color: colors.text, letterSpacing: -1, textAlign: "center" },
  subtitle: { marginTop: spacing.sm, fontSize: typography.bodySmall, lineHeight: 21, color: colors.textSecondary, textAlign: "center" },
  form: { width: "100%" },
  toggle: { fontSize: 13, fontWeight: "700", color: colors.primaryDark },
  error: { marginTop: -spacing.sm, marginBottom: spacing.lg, fontSize: typography.label, lineHeight: 20, color: colors.danger, textAlign: "center" },
  button: { minHeight: 56, borderRadius: radius.round, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, marginTop: spacing.sm, shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 3 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: typography.body, fontWeight: "800" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.xxl, gap: 5 },
  footerText: { fontSize: typography.label, color: colors.textSecondary },
  forgotRow: { alignItems: "flex-end", marginTop: -spacing.sm, marginBottom: spacing.md },
  link: { fontSize: typography.label, fontWeight: "800", color: colors.primaryDark },
});
