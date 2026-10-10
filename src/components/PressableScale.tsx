import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
} from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  style?: any;
  scaleTo?: number;
  children: React.ReactNode;
};

export default function PressableScale({
  style,
  scaleTo = 0.96,
  children,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      damping: 18,
      stiffness: 260,
      mass: 0.6,
    }).start();
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        animate(scaleTo);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animate(1);
        onPressOut?.(event);
      }}
      style={[
        style,
        { transform: [{ scale }] },
        disabled ? { opacity: 0.6 } : null,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}