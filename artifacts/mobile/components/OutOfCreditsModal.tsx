import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const CREDIT_PACKS = [
  { label: "20 credits", price: "Coming Soon", tokens: "~20 roasts" },
  { label: "50 credits", price: "Coming Soon", tokens: "~50 roasts" },
  { label: "120 credits", price: "Coming Soon", tokens: "~120 roasts" },
];

export function OutOfCreditsModal({ visible, onClose }: Props) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* ── Header ── */}
          <LinearGradient
            colors={["#1a0533", "#2d0a5e"]}
            style={styles.heroCard}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#8b5cf620", borderColor: "#8b5cf630" }]}>
              <Feather name="zap-off" size={26} color="#8b5cf6" />
            </View>
            <Text style={styles.heroTitle}>You're out of credits.</Text>
            <Text style={styles.heroBody}>
              Your roast credits are all used up.{"\n"}
              Credit packs are coming soon.
            </Text>
          </LinearGradient>

          {/* ── Coming soon packs ── */}
          <View style={styles.packsSection}>
            <Text style={[styles.packsLabel, { color: colors.mutedForeground }]}>
              UPCOMING CREDIT PACKS
            </Text>
            <View style={styles.packs}>
              {CREDIT_PACKS.map((pack) => (
                <View
                  key={pack.label}
                  style={[
                    styles.packCard,
                    { backgroundColor: colors.secondary, borderColor: colors.border, opacity: 0.55 },
                  ]}
                >
                  <View style={styles.packLeft}>
                    <Text style={[styles.packLabel, { color: colors.foreground }]}>{pack.label}</Text>
                    <Text style={[styles.packTokens, { color: colors.mutedForeground }]}>{pack.tokens}</Text>
                  </View>
                  <View style={[styles.packBadge, { backgroundColor: "#8b5cf610", borderColor: "#8b5cf625" }]}>
                    <Text style={styles.packBadgeText}>Soon</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── CTA ── */}
          <TouchableOpacity
            style={[styles.gotItBtn, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.gotItText}>Got it</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 2,
  },
  heroCard: {
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    color: "#f3e8ff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  heroBody: {
    color: "#a78bfa",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    textAlign: "center",
  },
  packsSection: { gap: 10 },
  packsLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    paddingHorizontal: 2,
  },
  packs: { gap: 8 },
  packCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  packLeft: { gap: 2 },
  packLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  packTokens: { fontSize: 11, fontFamily: "Inter_400Regular" },
  packBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  packBadgeText: {
    color: "#8b5cf6",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  gotItBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  gotItText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
