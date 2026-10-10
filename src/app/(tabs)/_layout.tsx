import React from "react";
import { Tabs } from "expo-router";
import AnimatedTabBar from "../../components/AnimatedTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <AnimatedTabBar
          {...(props as unknown as React.ComponentProps<typeof AnimatedTabBar>)}
        />
      )}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarLabel: "Home" }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: "Messages", tabBarLabel: "Messages" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarLabel: "Profile" }}
      />
    </Tabs>
  );
}
