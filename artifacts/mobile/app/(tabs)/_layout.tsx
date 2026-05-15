import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 58;

const TABS = [
  { name: "index", label: "Roast", icon: "zap" },
  { name: "vault", label: "Vault", icon: "archive" },
  { name: "settings", label: "Settings", icon: "settings" },
] as const;

function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 0 : insets.bottom;

  return (
    <View
      style={[
        styles.tabBar,
        { paddingBottom: bottomPad, height: TAB_BAR_HEIGHT + bottomPad },
      ]}
    >
      {TABS.map((tab, index) => {
        const isActive = state.index === index;
        const color = isActive ? "#8b5cf6" : "#6b7280";
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: state.routes[index]?.key,
                canPreventDefault: true,
              });
              if (!isActive && !event.defaultPrevented) {
                navigation.navigate(tab.name);
              }
            }}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.activeIndicator} />}
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Feather name={tab.icon as any} size={20} color={color} />
            </View>
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="vault" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#0d0d0d",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#1f1f1f",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 8,
    paddingTop: 6,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#8b5cf6",
  },
  iconWrap: {
    width: 36,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: "#8b5cf612",
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
    marginTop: 1,
  },
});
