import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { useUploadAvatar } from "../profile.mutations";

type AvatarPickerProps = {
  avatarUrl?: string | null;
};

export default function AvatarPicker({ avatarUrl }: AvatarPickerProps) {
  const uploadMutation = useUploadAvatar();
  const [pickerError, setPickerError] = useState<string | null>(null);

  const handleChooseImage = async () => {
    setPickerError(null);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled) return;

      const image = result.assets[0];

      if (!image?.uri) {
        throw new Error("Could not read the selected image.");
      }

      const mimeType = image.mimeType ?? "image/jpeg";
      const extension = mimeType.split("/")[1] ?? "jpg";
      const filename = image.fileName ?? `avatar-${Date.now()}.${extension}`;

      await uploadMutation.mutateAsync({
        uri: image.uri,
        filename,
        mimeType,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update your profile picture.";

      setPickerError(message);

      if (Platform.OS !== "web") {
        Alert.alert("Avatar upload failed", message);
      }
    }
  };

  const isUploading = uploadMutation.isPending;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change profile picture"
        disabled={isUploading}
        onPress={handleChooseImage}
        style={({ pressed }) => [
          styles.avatarButton,
          pressed && !isUploading && styles.pressed,
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Add photo</Text>
          </View>
        )}

        {isUploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={isUploading}
        onPress={handleChooseImage}
      >
        <Text style={styles.actionText}>
          {isUploading
            ? "Uploading…"
            : avatarUrl
              ? "Change photo"
              : "Add profile photo"}
        </Text>
      </Pressable>

      {pickerError && Platform.OS === "web" && (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {pickerError}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 10,
  },
  avatarButton: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
    backgroundColor: "#FCE7F3",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 56,
    backgroundColor: "#FCE7F3",
  },
  placeholderText: {
    color: "#9D174D",
    fontSize: 13,
    fontWeight: "600",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 56,
  },
  actionText: {
    color: "#BE185D",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.8,
  },
});
