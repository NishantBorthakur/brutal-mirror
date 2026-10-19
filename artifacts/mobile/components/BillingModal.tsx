import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { useColors } from "@/hooks/useColors";
import { getApiBaseUrl } from "@/lib/api";

const AUTH_TOKEN_KEY = "auth_session_token";

interface Pack {
  id: string;
  label: string;
  price: string;
  credits: number;
  bestValue?: boolean;
  popular?: boolean;
}

const PACKS: Pack[] = [
  { id: "starter", label: "Starter Pack", price: "₹49", credits: 20 },
  { id: "value", label: "Value Pack", price: "₹99", credits: 50, bestValue: true },
  { id: "power", label: "Power Pack", price: "₹199", credits: 120 },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BillingModal({ visible, onClose, onSuccess }: Props) {
  const colors = useColors();
  const { isAuthenticated, login, updateCreditsBalance } = useAuth();
  const { showToast } = useToast();
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);

  const handlePurchase = async (pack: Pack) => {
    if (!isAuthenticated) {
      onClose();
      await login();
      return;
    }

    setPurchasingPackId(pack.id);
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (!token) {
        showToast("Session expired. Please sign in again.", "error");
        return;
      }

      const apiBase = getApiBaseUrl();
      if (!apiBase) {
        showToast("Cannot connect to server.", "error");
        return;
      }

      const orderRes = await fetch(`${apiBase}/api/billing/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packId: pack.id }),
      });

      if (!orderRes.ok) {
        const errData = (await orderRes.json()) as { error?: string };
        showToast(errData.error ?? "Failed to create order.", "error");
        return;
      }

      const order = (await orderRes.json()) as {
        orderId: string;
        checkoutToken: string;
      };
      if (!order.checkoutToken) {
        throw new Error("Checkout authorization was not returned.");
      }
      const checkoutUrl = `${apiBase}/api/billing/checkout?orderId=${encodeURIComponent(order.orderId)}&checkoutToken=${encodeURIComponent(order.checkoutToken)}`;

      const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, "brutalmirror://");

      if (result.type === "success") {
        const url = result.url;
        if (url.includes("brutalmirror://payment/success")) {
          const paramStr = url.split("?")[1] ?? "";
          const params = new URLSearchParams(paramStr);
          const creditsAdded = parseInt(params.get("credits") ?? "0", 10);
          const newBalance = parseInt(params.get("balance") ?? "0", 10);
          if (newBalance > 0 || creditsAdded > 0) {
            updateCreditsBalance(newBalance);
          }
          showToast(`${creditsAdded} credits added! ⚡`);
          onSuccess?.();
          onClose();
        } else if (url.includes("payment/failed")) {
          showToast("Payment failed. No credits were added.", "error");
        } else if (url.includes("payment/cancelled")) {
          showToast("Payment cancelled.", "info");
        }
      }
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setPurchasingPackId(null);
    }
  };

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

          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>Buy Credits</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Each roast or refinement uses 1 credit.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.packs}
          >
            {PACKS.map((pack) => {
              const isLoading = purchasingPackId === pack.id;
              const isDisabled = !!purchasingPackId && !isLoading;

              return (
                <TouchableOpacity
                  key={pack.id}
                  activeOpacity={0.85}
                  disabled={isDisabled || isLoading}
                  onPress={() => void handlePurchase(pack)}
                  style={[
                    styles.packCard,
                    {
                      backgroundColor: pack.bestValue
                        ? "#1a0533"
                        : colors.secondary,
                      borderColor: pack.bestValue ? colors.primary + "60" : colors.border,
                      opacity: isDisabled ? 0.5 : 1,
                    },
                  ]}
                >
                  {pack.bestValue && (
                    <LinearGradient
                      colors={["#7c3aed", "#6d28d9"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.bestValueBadge}
                    >
                      <Feather name="star" size={10} color="#fff" />
                      <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </LinearGradient>
                  )}

                  <View style={styles.packBody}>
                    <View style={styles.packLeft}>
                      <Text
                        style={[
                          styles.packLabel,
                          { color: pack.bestValue ? "#f3e8ff" : colors.foreground },
                        ]}
                      >
                        {pack.label}
                      </Text>
                      <View style={styles.packCreditsRow}>
                        <Feather
                          name="zap"
                          size={12}
                          color={pack.bestValue ? "#a78bfa" : colors.primary}
                        />
                        <Text
                          style={[
                            styles.packCredits,
                            { color: pack.bestValue ? "#a78bfa" : colors.primary },
                          ]}
                        >
                          {pack.credits} credits · {pack.credits} roasts
                        </Text>
                      </View>
                    </View>

                    <View style={styles.packRight}>
                      <Text
                        style={[
                          styles.packPrice,
                          { color: pack.bestValue ? "#f3e8ff" : colors.foreground },
                        ]}
                      >
                        {pack.price}
                      </Text>
                      <View
                        style={[
                          styles.buyBtn,
                          {
                            backgroundColor: pack.bestValue
                              ? colors.primary
                              : colors.primary + "22",
                            borderColor: pack.bestValue
                              ? "transparent"
                              : colors.primary + "50",
                          },
                        ]}
                      >
                        {isLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={pack.bestValue ? "#fff" : colors.primary}
                          />
                        ) : (
                          <Text
                            style={[
                              styles.buyBtnText,
                              { color: pack.bestValue ? "#fff" : colors.primary },
                            ]}
                          >
                            Buy
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.trustRow}>
            <Feather name="lock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.trustText, { color: colors.mutedForeground }]}>
              Secure payments powered by Razorpay
            </Text>
          </View>
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
    maxHeight: "80%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  packs: { gap: 10, paddingBottom: 4 },
  packCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    padding: 16,
    gap: 10,
  },
  bestValueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bestValueText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  packBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  packLeft: { flex: 1, gap: 4 },
  packLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  packCreditsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  packCredits: { fontSize: 12, fontFamily: "Inter_400Regular" },
  packRight: { alignItems: "flex-end", gap: 6 },
  packPrice: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  buyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  buyBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    paddingTop: 4,
  },
  trustText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
