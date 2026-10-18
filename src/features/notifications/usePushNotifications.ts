import { useEffect } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

import { registerPushDevice } from "../../services/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !Device.isDevice) return;

    let active = true;
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const conversationId = Number(data.conversation_id);
      if (Number.isInteger(conversationId) && conversationId > 0) {
        router.push({
          pathname: "/chat/[conversationId]",
          params: { conversationId: String(conversationId) },
        });
      } else {
        router.push("/notifications");
      }
    });

    const register = async () => {
      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("messages", {
            name: "Messages",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#B85C70",
            sound: "default",
          });
        }

        const current = await Notifications.getPermissionsAsync();
        let status = current.status;
        if (status !== "granted") {
          const requested = await Notifications.requestPermissionsAsync();
          status = requested.status;
        }
        if (!active || status !== "granted") return;

        const projectId =
          Constants.easConfig?.projectId ??
          Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
          console.warn("Expo project ID is missing; push registration skipped.");
          return;
        }

        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (!active) return;
        await registerPushDevice({
          expo_push_token: token,
          platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web",
          device_name: Device.deviceName ?? undefined,
        });
      } catch (error) {
        // Push registration must not block app startup or chat access.
        console.warn("Push notification registration failed.", error);
      }
    };

    void register();
    return () => {
      active = false;
      responseSubscription.remove();
    };
  }, [enabled, router]);
}
