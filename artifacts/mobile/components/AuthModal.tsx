import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Tab = "login" | "signup";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AuthModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { signIn, signUp } = useAuth();

  const [tab, setTab] = useState<Tab>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFormError(null);
    setConfirmed(false);
    setShowPassword(false);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setFormError(null);
    setConfirmed(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setFormError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setFormError(null);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setFormError(error);
      return;
    }
    resetForm();
    onClose();
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      setFormError("Please enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setFormError(null);
    const { error, needsConfirmation } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      setFormError(error);
      return;
    }
    if (needsConfirmation) {
      setConfirmed(true);
      return;
    }
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.avoidingView}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {confirmed ? (
              /* ── Email confirmation screen ── */
              <View style={styles.confirmedContainer}>
                <View style={[styles.confirmedIcon, { backgroundColor: "#22c55e18", borderColor: "#22c55e30" }]}>
                  <Feather name="mail" size={28} color="#22c55e" />
                </View>
                <Text style={[styles.confirmedTitle, { color: colors.foreground }]}>
                  Check your email
                </Text>
                <Text style={[styles.confirmedBody, { color: colors.mutedForeground }]}>
                  We sent a confirmation link to{"\n"}
                  <Text style={{ color: colors.primary }}>{email}</Text>
                  {"\n\n"}
                  Click the link to verify your account, then come back and log in.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                  onPress={() => { switchTab("login"); }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Go to Log In</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* ── Header ── */}
                <View style={styles.headerRow}>
                  <View>
                    <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                      {tab === "signup" ? "Create account" : "Welcome back"}
                    </Text>
                    <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
                      {tab === "signup"
                        ? "Sign up and get 5 free roast credits."
                        : "Sign in to access your credits."}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.closeBtn, { borderColor: colors.border }]}
                    onPress={handleClose}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                {/* ── Tabs ── */}
                <View style={[styles.tabRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  {(["signup", "login"] as Tab[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.tabBtn,
                        tab === t && { backgroundColor: colors.primary + "22", borderColor: colors.primary + "60" },
                        tab !== t && { borderColor: "transparent" },
                      ]}
                      onPress={() => switchTab(t)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.tabLabel,
                          { color: tab === t ? colors.primary : colors.mutedForeground },
                        ]}
                      >
                        {t === "signup" ? "Sign Up" : "Log In"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ── Fields ── */}
                <View style={styles.fields}>
                  <View
                    style={[
                      styles.inputWrap,
                      { backgroundColor: colors.secondary, borderColor: colors.border },
                    ]}
                  >
                    <Feather name="mail" size={15} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.input, { color: colors.foreground }]}
                      placeholder="Email address"
                      placeholderTextColor={colors.mutedForeground + "80"}
                      value={email}
                      onChangeText={(t) => { setEmail(t); setFormError(null); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      selectionColor={colors.primary}
                    />
                  </View>

                  <View
                    style={[
                      styles.inputWrap,
                      { backgroundColor: colors.secondary, borderColor: colors.border },
                    ]}
                  >
                    <Feather name="lock" size={15} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.input, { color: colors.foreground }]}
                      placeholder="Password (min 6 chars)"
                      placeholderTextColor={colors.mutedForeground + "80"}
                      value={password}
                      onChangeText={(t) => { setPassword(t); setFormError(null); }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      selectionColor={colors.primary}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                      <Feather
                        name={showPassword ? "eye-off" : "eye"}
                        size={15}
                        color={colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ── Error ── */}
                {formError && (
                  <View
                    style={[
                      styles.errorBox,
                      { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "30" },
                    ]}
                  >
                    <Feather name="alert-circle" size={13} color={colors.destructive} />
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{formError}</Text>
                  </View>
                )}

                {/* ── Submit ── */}
                <TouchableOpacity
                  onPress={tab === "signup" ? handleSignUp : handleSignIn}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={loading ? ["#3b1a6e", "#4c1d95"] : ["#6d28d9", "#8b5cf6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.primaryBtn, { opacity: loading ? 0.75 : 1 }]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.primaryBtnText}>
                        {tab === "signup" ? "Create Account & Get 5 Credits" : "Log In"}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </KeyboardAvoidingView>
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
  avoidingView: {
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
    gap: 14,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
    lineHeight: 19,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tabRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  fields: {
    gap: 10,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 19,
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.1,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  confirmedContainer: {
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  confirmedIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmedTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  confirmedBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    textAlign: "center",
  },
});
