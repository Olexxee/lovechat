import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import PressableScale from "../../components/PressableScale";
import {
  createRelationship,
  searchUsers,
  type RelationshipType,
  type UserSearchResult,
} from "../../services/api";
import { colors, radius, spacing } from "../../constants/theme";

const relationshipTypes: {
  label: string;
  value: RelationshipType;
  description: string;
}[] = [
  { label: "Romantic", value: "ROMANTIC", description: "Your partner or significant other" },
  { label: "Friend", value: "FRIEND", description: "Someone you value as a friend" },
  { label: "Family", value: "FAMILY", description: "A member of your family" },
  { label: "Other", value: "OTHER", description: "Another important connection" },
];

export default function NewRelationshipScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("ROMANTIC");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const term = query.trim();
    if (selectedUser || term.length < 2) {
      setResults([]);
      setSearchError("");
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");
      try {
        const users = await searchUsers(term);
        if (!cancelled) setResults(users);
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setSearchError(err instanceof Error ? err.message : "Search failed. Try again.");
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, selectedUser]);

  const submitRequest = async () => {
    if (!selectedUser) {
      setError("Search for and select the person you want to connect with.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await createRelationship({
        identifier: selectedUser.email,
        relationship_type: relationshipType,
      });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </PressableScale>
            <Text style={styles.headerTitle}>New connection</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Text style={styles.heroHeart}>♡</Text>
            </View>
            <Text style={styles.eyebrow}>MAKE IT PERSONAL</Text>
            <Text style={styles.title}>Bring someone closer.</Text>
            <Text style={styles.subtitle}>
              Find their LoveChat account and send a request. You can start chatting after they accept.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who do you want to connect with?</Text>
            <Text style={styles.helper}>Search by their name or email address.</Text>
            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                value={selectedUser ? selectedUser.name : query}
                onChangeText={(value) => {
                  setSelectedUser(null);
                  setQuery(value);
                  setError("");
                }}
                placeholder="Search name or email"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                returnKeyType="search"
                editable={!isSubmitting}
                style={styles.searchInput}
                accessibilityLabel="Search people by name or email"
              />
              {!!(query || selectedUser) && (
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  onPress={() => {
                    setQuery("");
                    setSelectedUser(null);
                    setResults([]);
                    setError("");
                  }}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearText}>×</Text>
                </PressableScale>
              )}
            </View>

            {isSearching && (
              <View style={styles.searchStatus}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.statusText}>Searching people…</Text>
              </View>
            )}
            {!!searchError && <Text style={styles.errorText}>{searchError}</Text>}

            {!selectedUser && query.trim().length >= 2 && !isSearching && !searchError && (
              <View style={styles.results}>
                {results.length ? results.map((person) => (
                  <PressableScale
                    key={person.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedUser(person);
                      setQuery(person.name);
                      setResults([]);
                      setError("");
                    }}
                    style={styles.resultRow}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{person.name.trim().charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.personName} numberOfLines={1}>{person.name}</Text>
                      <Text style={styles.personEmail} numberOfLines={1}>{person.email}</Text>
                    </View>
                    <Text style={styles.resultArrow}>›</Text>
                  </PressableScale>
                )) : (
                  <Text style={styles.noResults}>No matching accounts found.</Text>
                )}
              </View>
            )}

            {selectedUser && (
              <View style={styles.selectedCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{selectedUser.name.trim().charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.personName}>{selectedUser.name}</Text>
                  <Text style={styles.personEmail}>{selectedUser.email}</Text>
                </View>
                <Text style={styles.selectedCheck}>✓</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What is your relationship?</Text>
            <Text style={styles.helper}>Choose how you know each other.</Text>
            <View style={styles.typeList}>
              {relationshipTypes.map((type) => {
                const selected = relationshipType === type.value;
                return (
                  <PressableScale
                    key={type.value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    disabled={isSubmitting}
                    onPress={() => setRelationshipType(type.value)}
                    style={[styles.typeCard, selected && styles.typeCardSelected]}
                  >
                    <View style={styles.typeCopy}>
                      <Text style={[styles.typeTitle, selected && styles.typeTitleSelected]}>{type.label}</Text>
                      <Text style={styles.typeDescription}>{type.description}</Text>
                    </View>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <PressableScale
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={submitRequest}
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>Send relationship request  →</Text>
            )}
          </PressableScale>
          <Text style={styles.privacyNote}>Your conversation stays locked until the request is accepted.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxxl },
  header: { flexDirection: "row", alignItems: "center", minHeight: 48, marginBottom: spacing.xxl },
  backButton: { width: 42, height: 42, borderRadius: radius.round, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  backButtonText: { color: colors.text, fontSize: 30, lineHeight: 33, marginTop: -3 },
  headerTitle: { flex: 1, marginLeft: spacing.md, color: colors.text, fontSize: 16, fontWeight: "800" },
  headerSpacer: { width: 42 },
  hero: { marginBottom: spacing.xxxl },
  heroIcon: { width: 54, height: 54, borderRadius: radius.round, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  heroHeart: { color: colors.primary, fontSize: 37, lineHeight: 42 },
  eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: "800", letterSpacing: 1.8, marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: 29, lineHeight: 36, fontWeight: "800", letterSpacing: -0.9 },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: spacing.sm },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  helper: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: spacing.md },
  searchWrap: { minHeight: 56, flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  searchIcon: { fontSize: 25, color: colors.primaryDark, marginRight: spacing.sm },
  searchInput: { flex: 1, minHeight: 54, color: colors.text, fontSize: 15, paddingVertical: spacing.sm },
  clearButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  clearText: { fontSize: 24, color: colors.textMuted },
  searchStatus: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md },
  statusText: { color: colors.textSecondary, fontSize: 13 },
  results: { marginTop: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden" },
  resultRow: { flexDirection: "row", alignItems: "center", padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  avatar: { width: 44, height: 44, borderRadius: radius.round, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSoft },
  avatarText: { color: colors.primaryDark, fontSize: 17, fontWeight: "800" },
  resultInfo: { flex: 1, marginLeft: spacing.md },
  personName: { color: colors.text, fontSize: 14, fontWeight: "800" },
  personEmail: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  resultArrow: { color: colors.textMuted, fontSize: 26, marginLeft: spacing.sm },
  noResults: { padding: spacing.lg, color: colors.textSecondary, fontSize: 13 },
  selectedCard: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceSoft },
  selectedCheck: { color: colors.primaryDark, fontSize: 20, fontWeight: "900" },
  typeList: { gap: spacing.xs },
  typeCard: { flexDirection: "row", alignItems: "center", minHeight: 72, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface },
  typeCardSelected: { backgroundColor: colors.surfaceSoft },
  typeCopy: { flex: 1, paddingRight: spacing.md },
  typeTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  typeTitleSelected: { color: colors.primaryDark },
  typeDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
  radio: { width: 22, height: 22, borderRadius: radius.round, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: colors.primaryDark },
  radioDot: { width: 12, height: 12, borderRadius: radius.round, backgroundColor: colors.primary },
  errorBox: { padding: spacing.md, backgroundColor: "#FBEAEC", borderRadius: radius.md, marginBottom: spacing.md },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  submitButton: { minHeight: 54, borderRadius: radius.round, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  disabledButton: { opacity: 0.65 },
  submitText: { color: colors.white, fontSize: 14, fontWeight: "800" },
  privacyNote: { color: colors.textMuted, fontSize: 11, lineHeight: 18, textAlign: "center", marginTop: spacing.md },
});
