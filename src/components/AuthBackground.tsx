import React from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "../constants/theme";

export default function AuthBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.blob, styles.topBlob]} />
      <View style={[styles.blob, styles.bottomBlob]} />
      <View style={styles.ring} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  topBlob: {
    width: 320,
    height: 320,
    top: -130,
    right: -110,
    backgroundColor: colors.primary,
    opacity: 0.12,
  },
  bottomBlob: {
    width: 260,
    height: 260,
    bottom: -110,
    left: -110,
    backgroundColor: colors.primaryDark,
    opacity: 0.08,
  },
  ring: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: colors.primary,
    opacity: 0.08,
    top: "32%",
    left: -130,
  },
});
