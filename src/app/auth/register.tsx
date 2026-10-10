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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
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

  const handleRegister = async () => {
    setError("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName) {
      setError("Please enter your name.");
      triggerShake();
      return;
    }
    if (!normalizedEmail) {
      setError("Please enter your email.");
      triggerShake();
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      triggerShake();
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: normalizedName,
        email: normalizedEmail,
        password,
      });
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create your account.",
      );
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Reveal style={styles.brandSection}>
            <PulsingHeart />
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              LoveChat is just for the two of us.
            </Text>
          </Reveal>

          <Animated.View style={[styles.form, { transform: [{ translateX }] }]}>
            <Reveal delay={140}>
              <AuthField
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
              />
            </Reveal>

            <Reveal delay={200}>
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

            <Reveal delay={260}>
              <AuthField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
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

            {error ? (
              <Reveal duration={260}>
                <Text style={styles.error}>{error}</Text>
              </Reveal>
            ) : null}

            <Reveal delay={330}>
              <PressableScale
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Create account</Text>
                )}
              </PressableScale>
            </Reveal>
          </Animated.View>

          <Reveal delay={400} style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/auth/login" asChild>
              <Pressable disabled={isLoading}>
                <Text style={styles.link}>Sign in</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  brandSection: { alignItems: "center", marginBottom: spacing.xxl },
  title: {
    marginTop: spacing.lg,
    fontSize: typography.heading,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.7,
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
  },
  form: { width: "100%" },
  toggle: { fontSize: 13, fontWeight: "700", color: colors.primary },
  error: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    fontSize: typography.label,
    color: colors.primaryDark,
    textAlign: "center",
  },
  button: {
    height: 54,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xxl,
    gap: 5,
  },
  footerText: { fontSize: typography.label, color: colors.textSecondary },
  link: {
    fontSize: typography.label,
    fontWeight: "700",
    color: colors.primary,
  },
});
