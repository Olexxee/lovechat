import React, { useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors, radius, spacing, typography } from "../constants/theme";


type Props = TextInputProps & {
  label: string;
  rightAccessory?: React.ReactNode;
};

export default function AuthField({
  label,
  rightAccessory,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const focus = useRef(new Animated.Value(0)).current;

  const animateFocus = (toValue: number) =>
    Animated.timing(focus, {
      toValue,
      duration: 180,
      useNativeDriver: false,
    }).start();

  const borderColor = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  return (
    <View style={styles.field}>
      <Text style={[styles.label, focused && styles.labelFocused]}>
        {label}
      </Text>

      <Animated.View style={[styles.inputWrap, { borderColor }]}>
        <TextInput
          {...rest}
          editable={editable}
          onFocus={(event) => {
            setFocused(true);
            animateFocus(1);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            animateFocus(0);
            onBlur?.(event);
          }}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        {rightAccessory ? (
          <View style={styles.accessory}>{rightAccessory}</View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
    fontSize: typography.label,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  labelFocused: {
    color: colors.primaryDark,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: typography.body,
    color: colors.text,
  },
  accessory: {
    marginLeft: spacing.sm,
  },
});
