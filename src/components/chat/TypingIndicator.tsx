import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";


export default function TypingIndicator({
  partnerName,
}: {
  partnerName: string;
}) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  return (
    <Animated.View style={[styles.row, { transform: [{ translateY }] }]}>
      <View style={styles.bubble}>
        <Text style={styles.dots}>•••</Text>
      </View>
      <Text style={styles.label}>{partnerName} is typing</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dots: {
    color: colors.primary,
    fontSize: 18,
    letterSpacing: 2,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
