import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AuthModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { login, authLoading } = useAuth();

  const handleLogin = async () => {
    onClose();
    await login();
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

          {/* Icon */}
          <View style={styles.iconRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}>
              <Feather name="zap" size={28} color={colors.primary} />
            </View>
          </View>

          {/* Title */}
          <View style={styles.textBlock}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Sign in to roast
            </Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              Create a free account and get{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>
                5 free roast credits
              </Text>{" "}
              to try the full experience.
            </Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={authLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#6d28d9", "#8b5cf6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.btn, { opacity: authLoading ? 0.6 : 1 }]}
            >
              {authLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="log-in" size={16} color="#fff" />
                  <Text style={styles.btnText}>Sign In / Create Account</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
              Maybe later
            </Text>
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
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  iconRow: { alignItems: "center" },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { gap: 8, alignItems: "center" },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    textAlign: "center",
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.1,
  },
  cancelBtn: { alignItems: "center", paddingVertical: 4 },
  cancelText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
