import React, { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../constants/theme";

type TabMeta = {
  label: string;
  active: React.ComponentProps<typeof Ionicons>["name"];
  inactive: React.ComponentProps<typeof Ionicons>["name"];
};

const TAB_META: Record<string, TabMeta> = {
  index: { label: "Home", active: "heart", inactive: "heart-outline" },
  messages: { label: "Messages", active: "chatbubble-ellipses", inactive: "chatbubble-ellipses-outline" },
  profile: { label: "You", active: "person", inactive: "person-outline" },
};

type AnimatedTabBarProps = {
  state: { index: number; routes: Array<{ key: string; name: string; params?: object }> };
  descriptors: Record<string, { options: { title?: string; tabBarAccessibilityLabel?: string; tabBarTestID?: string } }>;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented?: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

export default function AnimatedTabBar({ state, descriptors, navigation }: AnimatedTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key]?.options;
          const meta = TAB_META[route.name] ?? {
            label: options?.title ?? route.name,
            active: "ellipse" as const,
            inactive: "ellipse-outline" as const,
          };

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options?.tabBarAccessibilityLabel}
              testID={options?.tabBarTestID}
              style={styles.tab}
            >
              <TabItem focused={focused} meta={meta} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabItem({ focused, meta }: { focused: boolean; meta: TabMeta }) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      damping: 17,
      stiffness: 210,
      mass: 0.7,
    }).start();
  }, [focused, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  return (
    <Animated.View style={[styles.tabInner, focused && styles.tabInnerActive, { transform: [{ scale }] }]}>
      <Ionicons name={focused ? meta.active : meta.inactive} size={21} color={focused ? colors.primaryDark : colors.textMuted} />
      <Text style={[styles.label, focused && styles.labelActive]}>{meta.label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    minHeight: 64,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    shadowColor: "#33252A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 5,
  },
  tab: { flex: 1, minHeight: 58, alignItems: "center", justifyContent: "center" },
  tabInner: {
    minWidth: 68,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabInnerActive: { backgroundColor: colors.surfaceSoft },
  label: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  labelActive: { color: colors.primaryDark, fontWeight: "800" },
});
