import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { colors, radius } from "../../constants/theme";

type Props = {
  uri: string;
  width?: number | null;
  height?: number | null;
  isMine: boolean;
};

const MAX_WIDTH = 240;
const MAX_HEIGHT = 320;

export default function ImageAttachment({ uri, width, height, isMine }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const ratio = width && height ? width / height : 1;
  let displayWidth = MAX_WIDTH;
  let displayHeight = MAX_WIDTH / ratio;

  if (displayHeight > MAX_HEIGHT) {
    displayHeight = MAX_HEIGHT;
    displayWidth = MAX_HEIGHT * ratio;
  }

  if (hasError) {
    return (
      <View
        style={[
          styles.fallback,
          { width: displayWidth, height: displayHeight },
          isMine ? styles.fallbackMine : styles.fallbackTheirs,
        ]}
      >
        <Text style={[styles.fallbackText, isMine && styles.fallbackTextMine]}>
          Image unavailable
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width: displayWidth, height: displayHeight }]}>
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator
            size="small"
            color={isMine ? colors.white : colors.primary}
          />
        </View>
      )}

      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackMine: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  fallbackTheirs: {
    backgroundColor: colors.surfaceSoft,
  },
  fallbackText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  fallbackTextMine: {
    color: "#FBE4E8",
  },
});
