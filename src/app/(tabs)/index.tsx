import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import PressableScale from "../../components/PressableScale";
import Reveal from "../../components/Reveal";
import { getRelationships } from "../../services/api";
import type { Relationship } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { colors, radius, spacing, typography } from "../../constants/theme";

// Extra room so the last row is never hidden behind the floating tab bar.
const TAB_BAR_CLEARANCE = 110;

function formatType(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadRelationships = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      setRelationships(await getRelationships());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your connections.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRelationships();
    }, [loadRelationships]),
  );

  const activeRelationships = relationships.filter(
    (relationship) => relationship.status === "ACTIVE",
  );

  const count = activeRelationships.length;
  const firstName = user?.name?.split(" ")[0] || "there";

  const subtitle =
    count === 0
      ? "Add someone to get started."
      : count === 1
        ? "1 connection"
        : `${count} connections`;

  const goToNew = () => router.push("/relationships/new");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadRelationships(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Single header: greeting + count on the left, one action on the right */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              Hi, {firstName}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add a relationship"
            style={styles.addButton}
            onPress={goToNew}
          >
            <Text style={styles.addButtonIcon}>+</Text>
          </PressableScale>
        </View>

        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateTitle}>Couldn't load connections</Text>
            <Text style={styles.stateText}>{error}</Text>
            <PressableScale
              style={styles.secondaryButton}
              onPress={() => void loadRelationships()}
            >
              <Text style={styles.secondaryButtonText}>Try again</Text>
            </PressableScale>
          </View>
        ) : count === 0 ? (
          <View style={styles.stateBlock}>
            <Text style={styles.emptyHeart}>♡</Text>
            <Text style={styles.stateTitle}>No connections yet</Text>
            <Text style={styles.stateText}>
              Add someone who already has a LoveChat account to start a private
              conversation.
            </Text>
            <PressableScale style={styles.primaryButton} onPress={goToNew}>
              <Text style={styles.primaryButtonText}>Add a relationship</Text>
            </PressableScale>
          </View>
        ) : (
          <Reveal>
            <View style={styles.group}>
              {activeRelationships.map((relationship, index) => (
                <View key={relationship.id}>
                  {index > 0 && <View style={styles.divider} />}

                  <PressableScale
                    style={styles.row}
                    onPress={() =>
                      router.push({
                        pathname: "/chat/[conversationId]",
                        params: {
                          conversationId: String(relationship.conversation_id),
                        },
                      })
                    }
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {relationship.partner.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.rowInfo}>
                      <Text style={styles.partnerName} numberOfLines={1}>
                        {relationship.partner.name}
                      </Text>
                      <Text style={styles.relationshipType}>
                        {formatType(relationship.relationship_type)}
                      </Text>
                    </View>

                    <Text style={styles.chevron}>›</Text>
                  </PressableScale>
                </View>
              ))}
            </View>
          </Reveal>
        )}
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
    paddingTop: spacing.lg,
    paddingBottom: TAB_BAR_CLEARANCE,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  addButtonIcon: {
    color: colors.white,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "600",
    marginTop: -1,
  },

  // Grouped list
  group: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 52 + spacing.lg + spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  avatarText: {
    color: colors.primaryDark,
    fontSize: 21,
    fontWeight: "800",
  },
  rowInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  partnerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  relationshipType: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 13,
    textTransform: "capitalize",
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 28,
    lineHeight: 30,
    marginLeft: spacing.sm,
  },

  // Loading / error / empty
  stateContainer: {
    paddingVertical: spacing.huge,
    alignItems: "center",
  },
  stateBlock: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
  },
  emptyHeart: {
    fontSize: 44,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  stateText: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
});