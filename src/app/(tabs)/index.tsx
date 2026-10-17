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
import { useAuth } from "../../context/AuthContext";
import {
  acceptRelationship,
  declineRelationship,
  getRelationships,
  type Relationship,
} from "../../services/api";
import { colors, radius, spacing } from "../../constants/theme";

const TAB_BAR_CLEARANCE = 116;

function formatType(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadRelationships = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError("");
    try {
      setRelationships(await getRelationships());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your connections.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadRelationships();
  }, [loadRelationships]));

  const respond = async (relationshipId: number, accept: boolean) => {
    setRespondingId(relationshipId);
    setError("");
    try {
      if (accept) await acceptRelationship(relationshipId);
      else await declineRelationship(relationshipId);
      await loadRelationships(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update this request.");
    } finally {
      setRespondingId(null);
    }
  };

  const active = relationships.filter((item) => item.status === "ACTIVE");
  const pending = relationships.filter((item) => item.status === "PENDING");
  const incoming = pending.filter((item) => item.requested_by_id !== user?.id);
  const outgoing = pending.filter((item) => item.requested_by_id === user?.id);
  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";

  const openChat = (relationship: Relationship) => {
    if (!relationship.conversation_id) return;
    router.push({
      pathname: "/chat/[conversationId]",
      params: { conversationId: String(relationship.conversation_id) },
    });
  };

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
        <View style={styles.topline}>
          <View style={styles.brandMark}><Text style={styles.brandHeart}>♡</Text></View>
          <Text style={styles.brandName}>LoveChat</Text>
          <View style={styles.toplineSpacer} />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add a connection"
            style={styles.addButton}
            onPress={() => router.push("/relationships/new")}
          >
            <Text style={styles.addButtonText}>＋</Text>
          </PressableScale>
        </View>

        <View style={styles.greeting}>
          <Text style={styles.eyebrow}>YOUR PRIVATE CIRCLE</Text>
          <Text style={styles.title}>Good to see you, {firstName}.</Text>
          <Text style={styles.subtitle}>Stay close to the people who matter.</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{active.length}</Text>
            <Text style={styles.summaryLabel}>Connections</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{incoming.length}</Text>
            <Text style={styles.summaryLabel}>Requests to review</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{outgoing.length}</Text>
            <Text style={styles.summaryLabel}>Awaiting reply</Text>
          </View>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <PressableScale onPress={() => void loadRelationships()} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </PressableScale>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.mutedText}>Loading your circle…</Text>
          </View>
        ) : (
          <>
            {incoming.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Connection requests</Text>
                    <Text style={styles.sectionSubtitle}>Choose who can join your circle.</Text>
                  </View>
                  <View style={styles.countPill}><Text style={styles.countPillText}>{incoming.length}</Text></View>
                </View>
                <View style={styles.requestList}>
                  {incoming.map((item) => (
                    <View key={item.id} style={styles.requestCard}>
                      <View style={styles.personRow}>
                        <View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.partner.name)}</Text></View>
                        <View style={styles.personInfo}>
                          <Text style={styles.personName} numberOfLines={1}>{item.partner.name}</Text>
                          <Text style={styles.personMeta}>{formatType(item.relationship_type)} · sent you a request</Text>
                        </View>
                        <View style={styles.pendingDot} />
                      </View>
                      <View style={styles.requestActions}>
                        <PressableScale
                          accessibilityRole="button"
                          disabled={respondingId === item.id}
                          onPress={() => void respond(item.id, false)}
                          style={styles.declineButton}
                        >
                          <Text style={styles.declineText}>Decline</Text>
                        </PressableScale>
                        <PressableScale
                          accessibilityRole="button"
                          disabled={respondingId === item.id}
                          onPress={() => void respond(item.id, true)}
                          style={styles.acceptButton}
                        >
                          {respondingId === item.id
                            ? <ActivityIndicator color={colors.white} size="small" />
                            : <Text style={styles.acceptText}>Accept request</Text>}
                        </PressableScale>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {outgoing.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Waiting for a reply</Text>
                    <Text style={styles.sectionSubtitle}>Your requests are pending until accepted.</Text>
                  </View>
                </View>
                <View style={styles.outgoingList}>
                  {outgoing.map((item) => (
                    <View key={item.id} style={styles.outgoingRow}>
                      <View style={[styles.avatar, styles.avatarSmall]}><Text style={styles.avatarText}>{initials(item.partner.name)}</Text></View>
                      <View style={styles.personInfo}>
                        <Text style={styles.personName}>{item.partner.name}</Text>
                        <Text style={styles.personMeta}>{formatType(item.relationship_type)}</Text>
                      </View>
                      <View style={styles.waitingPill}><Text style={styles.waitingText}>Pending</Text></View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Your connections</Text>
                  <Text style={styles.sectionSubtitle}>Private conversations, all in one place.</Text>
                </View>
                <Text style={styles.sectionCount}>{active.length}</Text>
              </View>

              {active.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIcon}><Text style={styles.emptyHeart}>♡</Text></View>
                  <Text style={styles.emptyTitle}>Your circle starts here.</Text>
                  <Text style={styles.emptyText}>Search for someone by name or email and send them a request. Your private chat opens when they accept.</Text>
                  <PressableScale style={styles.primaryButton} onPress={() => router.push("/relationships/new")}>
                    <Text style={styles.primaryButtonText}>Find someone</Text>
                  </PressableScale>
                </View>
              ) : (
                <View style={styles.connectionList}>
                  {active.map((item, index) => (
                    <View key={item.id}>
                      {index > 0 && <View style={styles.divider} />}
                      <PressableScale style={styles.connectionRow} onPress={() => openChat(item)}>
                        <View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.partner.name)}</Text></View>
                        <View style={styles.personInfo}>
                          <Text style={styles.personName}>{item.partner.name}</Text>
                          <Text style={styles.personMeta}>{formatType(item.relationship_type)}</Text>
                        </View>
                        <View style={styles.chatArrow}><Text style={styles.chatArrowText}>›</Text></View>
                      </PressableScale>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: TAB_BAR_CLEARANCE },
  topline: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xxl },
  brandMark: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  brandHeart: { color: colors.primary, fontSize: 26, lineHeight: 29 },
  brandName: { color: colors.text, fontSize: 17, fontWeight: "900", marginLeft: spacing.sm, letterSpacing: -0.4 },
  toplineSpacer: { flex: 1 },
  addButton: { width: 42, height: 42, borderRadius: radius.round, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  addButtonText: { color: colors.white, fontSize: 25, lineHeight: 28, fontWeight: "500", marginTop: -2 },
  greeting: { marginBottom: spacing.xl },
  eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: "900", letterSpacing: 2, marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: spacing.xs },
  summaryCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingVertical: spacing.lg, paddingHorizontal: spacing.sm, marginBottom: spacing.xxl },
  summaryItem: { flex: 1, alignItems: "center", paddingHorizontal: 2 },
  summaryNumber: { color: colors.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  summaryLabel: { color: colors.textSecondary, fontSize: 10, lineHeight: 14, textAlign: "center", marginTop: 4 },
  summaryDivider: { width: 1, height: 34, backgroundColor: colors.border },
  section: { marginBottom: spacing.xxl },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "900", letterSpacing: -0.4 },
  sectionSubtitle: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 4 },
  countPill: { minWidth: 27, height: 27, borderRadius: radius.round, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center", paddingHorizontal: 7 },
  countPillText: { color: colors.primaryDark, fontWeight: "900", fontSize: 12 },
  sectionCount: { color: colors.textMuted, fontWeight: "800", fontSize: 13 },
  requestList: { gap: spacing.md },
  requestCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.md },
  personRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: radius.round, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  avatarSmall: { width: 42, height: 42 },
  avatarText: { color: colors.primaryDark, fontSize: 16, fontWeight: "900" },
  personInfo: { flex: 1, marginLeft: spacing.md },
  personName: { color: colors.text, fontSize: 14, fontWeight: "800" },
  personMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 4, textTransform: "capitalize" },
  pendingDot: { width: 8, height: 8, borderRadius: radius.round, backgroundColor: colors.primary, marginHorizontal: spacing.sm },
  requestActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  declineButton: { flex: 1, minHeight: 43, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  declineText: { color: colors.textSecondary, fontSize: 13, fontWeight: "800" },
  acceptButton: { flex: 1.5, minHeight: 43, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  acceptText: { color: colors.white, fontSize: 13, fontWeight: "900" },
  outgoingList: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingHorizontal: spacing.md },
  outgoingRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
  waitingPill: { backgroundColor: "#FFF1D8", paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.round },
  waitingText: { color: "#8C5B12", fontSize: 11, fontWeight: "900" },
  connectionList: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingHorizontal: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 60 },
  connectionRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
  chatArrow: { width: 32, height: 32, borderRadius: radius.round, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  chatArrowText: { color: colors.primary, fontSize: 24, lineHeight: 26, marginTop: -2 },
  emptyCard: { alignItems: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl },
  emptyIcon: { width: 60, height: 60, borderRadius: radius.round, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  emptyHeart: { color: colors.primary, fontSize: 39, lineHeight: 44 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "900", textAlign: "center" },
  emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: spacing.sm },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.lg },
  primaryButtonText: { color: colors.white, fontSize: 13, fontWeight: "900" },
  loadingState: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.huge },
  mutedText: { color: colors.textSecondary, fontSize: 13 },
  errorBox: { padding: spacing.md, backgroundColor: "#FCEBED", borderRadius: radius.md, marginBottom: spacing.lg },
  errorText: { color: "#A52F42", fontSize: 13, lineHeight: 19 },
  retryButton: { alignSelf: "flex-start", paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginTop: spacing.xs },
  retryText: { color: colors.primaryDark, fontSize: 13, fontWeight: "900" },
});
