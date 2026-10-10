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
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import PressableScale from "../../components/PressableScale";
import Reveal from "../../components/Reveal";
import { createRelationship, RelationshipType } from "../../services/api";
import { colors, radius, spacing, typography } from "../../constants/theme";

const relationshipTypes: {
  label: string;
  value: RelationshipType;
  description: string;
}[] = [
  {
    label: "Romantic",
    value: "ROMANTIC",
    description: "Your partner or significant other",
  },
  {
    label: "Friend",
    value: "FRIEND",
    description: "Someone you value as a friend",
  },
  {
    label: "Family",
    value: "FAMILY",
    description: "A member of your family",
  },
  {
    label: "Other",
    value: "OTHER",
    description: "Another important connection",
  },
];

export default function NewRelationshipScreen() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [relationshipType, setRelationshipType] =
    useState<RelationshipType>("ROMANTIC");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const shake = useRef(new Animated.Value(0)).current;
  const focus = useRef(new Animated.Value(0)).current;

  const translateX = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-9, 9],
  });

  const borderColor = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

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

  const animateFocus = (toValue: number) =>
    Animated.timing(focus, {
      toValue,
      duration: 180,
      useNativeDriver: false,
    }).start();

  const handleCreateRelationship = async () => {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier) {
      setError(
        "Enter the email address of the person you want to connect with.",
      );
      triggerShake();
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await createRelationship({
        identifier: normalizedIdentifier,
        relationship_type: relationshipType,
      });

      router.replace("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't create this relationship. Please try again.",
      );
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Reveal style={styles.header}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </PressableScale>

            <Text style={styles.headerTitle}>New relationship</Text>

            <View style={styles.headerSpacer} />
          </Reveal>

          {/* Intro */}
          <Reveal delay={80} style={styles.intro}>
            <View style={styles.heartCircle}>
              <Text style={styles.heart}>♥</Text>
            </View>

            <Text style={styles.title}>Bring someone closer.</Text>

            <Text style={styles.subtitle}>
              Create a private connection with someone who already has a
              LoveChat account.
            </Text>
          </Reveal>

          <Animated.View style={[styles.form, { transform: [{ translateX }] }]}>
            <Reveal delay={160}>
              <Text style={styles.label}>Their email address</Text>

              <Animated.View style={[styles.inputWrap, { borderColor }]}>
                <TextInput
                  value={identifier}
                  onChangeText={(value) => {
                    setIdentifier(value);
                    if (error) setError("");
                  }}
                  onFocus={() => {
                    setIsFocused(true);
                    animateFocus(1);
                  }}
                  onBlur={() => {
                    setIsFocused(false);
                    animateFocus(0);
                  }}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!isSubmitting}
                  returnKeyType="done"
                  onSubmitEditing={handleCreateRelationship}
                  style={styles.input}
                  accessibilityLabel="Person's email address"
                />
              </Animated.View>

              <Text style={styles.helperText}>
                Use the email address they registered with.
              </Text>
            </Reveal>

            <Reveal delay={240}>
              <Text style={[styles.label, styles.typeLabel]}>
                What is your relationship?
              </Text>
            </Reveal>

            <View style={styles.typeList}>
              {relationshipTypes.map((type, index) => {
                const selected = relationshipType === type.value;

                return (
                  <Reveal key={type.value} delay={300 + index * 60}>
                    <PressableScale
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      disabled={isSubmitting}
                      onPress={() => setRelationshipType(type.value)}
                      style={[
                        styles.typeCard,
                        selected && styles.typeCardSelected,
                      ]}
                    >
                      <View style={styles.typeTextContainer}>
                        <Text
                          style={[
                            styles.typeTitle,
                            selected && styles.typeTitleSelected,
                          ]}
                        >
                          {type.label}
                        </Text>

                        <Text style={styles.typeDescription}>
                          {type.description}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.radioOuter,
                          selected && styles.radioOuterSelected,
                        ]}
                      >
                        {selected && <View style={styles.radioInner} />}
                      </View>
                    </PressableScale>
                  </Reveal>
                );
              })}
            </View>

            {!!error && (
              <Reveal duration={260} style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </Reveal>
            )}

            <Reveal delay={560}>
              <PressableScale
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={handleCreateRelationship}
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Create relationship
                  </Text>
                )}
              </PressableScale>
            </Reveal>

            <Reveal delay={620}>
              <Text style={styles.privacyNote}>
                ♥ Your connection will have its own private conversation.
              </Text>
            </Reveal>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 38,
    marginTop: -4,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  headerSpacer: {
    width: 42,
  },
  intro: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heartCircle: {
    width: 76,
    height: 76,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heart: {
    fontSize: 35,
    color: colors.primary,
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: spacing.md,
    maxWidth: 310,
  },
  form: {
    width: "100%",
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  inputWrap: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  input: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 15,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  typeLabel: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  typeList: {
    gap: spacing.md,
  },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    minHeight: 76,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSoft,
  },
  typeTextContainer: {
    flex: 1,
    paddingRight: spacing.md,
  },
  typeTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  typeTitleSelected: {
    color: colors.primaryDark,
  },
  typeDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  errorContainer: {
    backgroundColor: "#FCEBED",
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  errorText: {
    color: "#A52F42",
    fontSize: 13,
    lineHeight: 20,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  privacyNote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
