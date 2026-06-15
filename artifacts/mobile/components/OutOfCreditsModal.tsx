import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BillingModal } from "@/components/BillingModal";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function OutOfCreditsModal({ visible, onClose }: Props) {
  const colors = useColors();
  const [showBilling, setShowBilling] = useState(false);

  return (
    <>
      <BillingModal
        visible={showBilling}
        onClose={() => setShowBilling(false)}
        onSuccess={() => {
          setShowBilling(false);
          onClose();
        }}
      />

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

            <LinearGradient colors={["#1a0533", "#2d0a5e"]} style={styles.heroCard}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: "#8b5cf620", borderColor: "#8b5cf630" },
                ]}
              >
                <Feather name="zap-off" size={26} color="#8b5cf6" />
              </View>
              <Text style={styles.heroTitle}>You're out of credits.</Text>
              <Text style={styles.heroBody}>
                You've used all your roast credits.{"\n"}
                Top up to keep the roasts coming.
              </Text>
            </LinearGradient>

            <TouchableOpacity
              style={[styles.buyBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowBilling(true)}
              activeOpacity={0.85}
            >
              <Feather name="zap" size={16} color="#fff" />
              <Text style={styles.buyBtnText}>Buy Credits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.laterText, { color: colors.mutedForeground }]}>
                Maybe later
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  buyBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
  },
  buyBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  laterBtn: { alignItems: "center", paddingVertical: 4 },
  laterText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
