import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const ONBOARDING_KEY = "brutal_mirror_onboarding_v1";

const BULLETS = [
  { icon: "bar-chart-2", text: "Roast Report scores across 6 dimensions" },
  { icon: "refresh-cw", text: "Before vs After rewrites that actually help" },
  { icon: "share-2", text: "Shareable one-liners built for screenshots" },
];

interface Props {
  onDismiss: () => void;
}

export function OnboardingCard({ onDismiss }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleDismiss = async () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -16, duration: 230, useNativeDriver: true }),
    ]).start(onDismiss);
    await AsyncStorage.setItem(ONBOARDING_KEY, "dismissed");
  };

  return (
    <Animated.View
      style={[styles.wrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <LinearGradient
        colors={["#1a0533", "#2a0a54", "#150328"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Glow orb */}
        <View style={styles.glow} />

        {/* Header */}
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandLabel}>BRUTAL MIRROR</Text>
        </View>

        <Text style={styles.title}>Welcome to{"\n"}Brutal Mirror</Text>
        <Text style={styles.body}>
          Paste an idea, bio, profile, resume, or plan. Get a savage
          diagnosis, practical fixes, and a better version — fast.
        </Text>

        {/* Feature bullets */}
        <View style={styles.bullets}>
          {BULLETS.map((b) => (
            <View key={b.icon} style={styles.bullet}>
              <View style={styles.bulletIcon}>
                <Feather name={b.icon as any} size={13} color="#a78bfa" />
              </View>
              <Text style={styles.bulletText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleDismiss}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#6d28d9", "#8b5cf6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Feather name="zap" size={15} color="#fff" />
              <Text style={styles.primaryBtnText}>Start Roasting</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export async function isOnboardingDismissed(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val !== null;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#7c3aed35",
    gap: 18,
  },
  glow: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#8b5cf6",
    opacity: 0.1,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  brandDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#8b5cf6" },
  brandLabel: {
    color: "#a78bfa",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  title: {
    color: "#f3e8ff",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  body: {
    color: "#a78bfa",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  bullets: { gap: 10 },
  bullet: { flexDirection: "row", alignItems: "center", gap: 12 },
  bulletIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#8b5cf618",
    borderWidth: 1,
    borderColor: "#7c3aed30",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bulletText: {
    color: "#c4b5fd",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
    lineHeight: 19,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  primaryBtn: { flex: 1, borderRadius: 12, overflow: "hidden" },
  primaryBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  skipText: {
    color: "#6d28d9",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
