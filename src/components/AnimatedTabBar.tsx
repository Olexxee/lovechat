import React, { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../constants/theme";

type TabMeta = {
  label: string;
  active: React.ComponentProps<typeof Ionicons>["name"];
  inactive: React.ComponentProps<typeof Ionicons>["name"];
};

const TAB_META: Record<string, TabMeta> = {
  index: {
    label: "Home",
    active: "heart",
    inactive: "heart-outline",
  },
  messages: {
    label: "Messages",
    active: "chatbubble-ellipses",
    inactive: "chatbubble-ellipses-outline",
  },
  profile: {
    label: "Profile",
    active: "person",
    inactive: "person-outline",
  },
};

type AnimatedTabBarProps = {
  state: {
    index: number;
    routes: Array<{
      key: string;
      name: string;
      params?: object;
    }>;
  };
  descriptors: Record<
    string,
    {
      options: {
        title?: string;
        tabBarAccessibilityLabel?: string;
        tabBarTestID?: string;
      };
    }
  >;
  navigation: {
    emit: (event: {
      type: string;
      target: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented?: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

export default function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: AnimatedTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
    >
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
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
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

function TabItem({
  focused,
  meta,
}: {
  focused: boolean;
  meta: TabMeta;
}) {
  const progress = useRef(
    new Animated.Value(focused ? 1 : 0),
  ).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      damping: 16,
      stiffness: 220,
      mass: 0.7,
    }).start();
  }, [focused, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  return (
    <Animated.View
      style={[styles.tabInner, { transform: [{ scale }] }]}
    >
      <Ionicons
        name={focused ? meta.active : meta.inactive}
        size={21}
        color={focused ? colors.primaryDark : colors.textMuted}
      />
      <Text style={[styles.label, focused && styles.labelActive]}>
        {meta.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
});