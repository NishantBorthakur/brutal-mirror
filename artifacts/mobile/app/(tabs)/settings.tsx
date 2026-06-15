import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthModal } from "@/components/AuthModal";
import { BillingModal } from "@/components/BillingModal";
import { ONBOARDING_KEY } from "@/components/OnboardingCard";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useRoast } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  "Instagram Bio",
  "Startup Idea",
  "Dating Profile",
  "Resume Summary",
  "Business Name",
  "YouTube Channel Idea",
  "Mobile App Idea",
  "Personal Goal",
  "Other",
];

const INTENSITIES = [
  { label: "Honest", color: "#6b7280", emoji: "🙂" },
  { label: "Harsh", color: "#f59e0b", emoji: "😬" },
  { label: "Brutal", color: "#ef4444", emoji: "💀" },
  { label: "Career-ending", color: "#8b5cf6", emoji: "☠️" },
];

const PERSONALITIES = [
  { label: "Savage Mentor", icon: "🧠" },
  { label: "Startup Investor", icon: "💰" },
  { label: "Creative Director", icon: "🎨" },
  { label: "Dating Coach", icon: "💘" },
  { label: "Resume Recruiter", icon: "📋" },
  { label: "Internet Troll, but useful", icon: "💀" },
];

interface TransactionItem {
  id: string;
  type: string;
  credits: number;
  balanceAfter?: number;
  reason: string;
  createdAt: string;
}

function getApiBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{title}</Text>
          {options.map((opt) => {
            const isSelected = opt === selected;
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.sheetOption,
                  {
                    backgroundColor: isSelected ? colors.primary + "18" : "transparent",
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { onSelect(opt); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.sheetOptionText, { color: isSelected ? colors.primary : colors.foreground }]}>
                  {opt}
                </Text>
                {isSelected && <Feather name="check" size={16} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{title}</Text>
  );
}

function SettingRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={styles.settingRight}>
        <Text style={[styles.settingValue, { color: colors.foreground }]} numberOfLines={1}>
          {value}
        </Text>
        <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

function DangerRow({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.dangerRow, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive + "30" }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Feather name="trash-2" size={15} color={colors.destructive} />
      <Text style={[styles.dangerLabel, { color: colors.destructive }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function txLabel(type: string, reason: string): string {
  if (type === "purchase") return "Purchase";
  if (type === "initial_grant") return "Welcome gift";
  if (reason.toLowerCase().includes("refine")) return "Refinement";
  return "Roast";
}

function txIcon(type: string): "plus-circle" | "minus-circle" | "gift" {
  if (type === "purchase" || type === "initial_grant") return "plus-circle";
  return "minus-circle";
}

function txColor(type: string): string {
  if (type === "purchase" || type === "initial_grant") return "#10b981";
  return "#ef4444";
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, clearHistory } = useRoast();
  const { user, credits, logout, isAuthenticated, getToken, refreshCredits } = useAuth();
  const { showToast } = useToast();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showIntensityPicker, setShowIntensityPicker] = useState(false);
  const [showPersonalityPicker, setShowPersonalityPicker] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setTransactions([]);
      return;
    }
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${getApiBaseUrl()}/api/billing/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { transactions: TransactionItem[] };
          setTransactions(data.transactions);
        }
      } catch {}
    })();
  }, [isAuthenticated, getToken]);

  const handleClearHistory = () => {
    Alert.alert(
      "Clear All Saved Roasts",
      "This will permanently delete your entire Roast Vault. No going back.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await clearHistory();
            showToast("Roast Vault cleared", "info");
          },
        },
      ]
    );
  };

  const handleResetOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    showToast("Welcome screen will show on next launch", "info");
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            showToast("Signed out", "info");
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <BillingModal
        visible={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        onSuccess={() => void refreshCredits().then(() => {
          const token = getToken();
          void token.then(async (t) => {
            if (!t) return;
            const res = await fetch(`${getApiBaseUrl()}/api/billing/transactions`, {
              headers: { Authorization: `Bearer ${t}` },
            });
            if (res.ok) {
              const data = (await res.json()) as { transactions: TransactionItem[] };
              setTransactions(data.transactions);
            }
          });
        })}
      />
      <PickerModal
        visible={showCategoryPicker}
        title="Default Category"
        options={CATEGORIES}
        selected={settings.defaultCategory}
        onSelect={(v) => { updateSettings({ defaultCategory: v }); showToast("Default category saved"); }}
        onClose={() => setShowCategoryPicker(false)}
      />
      <PickerModal
        visible={showIntensityPicker}
        title="Default Intensity"
        options={INTENSITIES.map((i) => i.label)}
        selected={settings.defaultIntensity}
        onSelect={(v) => { updateSettings({ defaultIntensity: v }); showToast("Default intensity saved"); }}
        onClose={() => setShowIntensityPicker(false)}
      />
      <PickerModal
        visible={showPersonalityPicker}
        title="Default Roast Personality"
        options={PERSONALITIES.map((p) => p.label)}
        selected={settings.defaultPersonality}
        onSelect={(v) => { updateSettings({ defaultPersonality: v }); showToast("Default personality saved"); }}
        onClose={() => setShowPersonalityPicker(false)}
      />

      <View
        style={[
          styles.header,
          { paddingTop: topPad + 14, borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Account ── */}
        <SectionHeader title="ACCOUNT" />
        {user ? (
          <View style={[styles.group, { borderColor: colors.border }]}>
            <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: "transparent" }]}>
              <View style={styles.accountIconRow}>
                <View style={[styles.accountIcon, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}>
                  <Feather name="user" size={13} color={colors.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>Email</Text>
              </View>
              <Text style={[styles.settingValue, { color: colors.foreground, flexShrink: 1 }]} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: "transparent" }]}>
              <View style={styles.accountIconRow}>
                <View style={[styles.accountIcon, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}>
                  <Feather name="zap" size={13} color={colors.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>Credits</Text>
              </View>
              <View style={styles.creditBadgeRow}>
                <View style={[styles.creditBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}>
                  <Text style={[styles.creditBadgeText, { color: colors.primary }]}>{credits} remaining</Text>
                </View>
              </View>
            </View>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={[styles.settingRow, { backgroundColor: colors.card, borderColor: "transparent" }]}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <View style={styles.accountIconRow}>
                <View style={[styles.accountIcon, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "30" }]}>
                  <Feather name="log-out" size={13} color={colors.destructive} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.destructive }]}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.signInCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <LinearGradient
              colors={["#1a0533", "#2a0a54"]}
              style={styles.signInGradient}
            >
              <View style={styles.signInGradientInner}>
                <View style={styles.signInTextBlock}>
                  <Text style={styles.signInCardTitle}>Create a free account</Text>
                  <Text style={styles.signInCardBody}>
                    Sign up and get 5 free roast credits to try the full experience.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.signInCardBtn}
                  onPress={() => setShowAuthModal(true)}
                  activeOpacity={0.85}
                >
                  <Feather name="zap" size={14} color="#fff" />
                  <Text style={styles.signInCardBtnText}>Sign In / Sign Up</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ── Buy Credits ── */}
        {isAuthenticated && (
          <>
            <SectionHeader title="CREDITS" />
            <TouchableOpacity
              style={[styles.buyCreditsRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowBillingModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#1a0533", "#2d0a5e"]}
                style={styles.buyCreditsGradient}
              >
                <View style={styles.buyCreditsLeft}>
                  <View style={[styles.buyCreditsIcon, { backgroundColor: "#8b5cf620", borderColor: "#8b5cf630" }]}>
                    <Feather name="zap" size={16} color="#8b5cf6" />
                  </View>
                  <View>
                    <Text style={styles.buyCreditsTitle}>Buy Credits</Text>
                    <Text style={styles.buyCreditsSubtitle}>Packs from ₹49 · 20–120 roasts</Text>
                  </View>
                </View>
                <View style={styles.buyCreditsChevron}>
                  <Feather name="chevron-right" size={16} color="#a78bfa" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* ── Transaction History ── */}
        {isAuthenticated && transactions.length > 0 && (
          <>
            <SectionHeader title="TRANSACTION HISTORY" />
            <View style={[styles.group, { borderColor: colors.border }]}>
              {transactions.slice(0, 10).map((tx, idx) => {
                const isPositive = tx.type === "purchase" || tx.type === "initial_grant";
                const color = txColor(tx.type);
                return (
                  <React.Fragment key={tx.id}>
                    {idx > 0 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
                    <View style={[styles.txRow, { backgroundColor: colors.card }]}>
                      <View style={[styles.txIconWrap, { backgroundColor: color + "15" }]}>
                        <Feather name={txIcon(tx.type)} size={13} color={color} />
                      </View>
                      <View style={styles.txMiddle}>
                        <Text style={[styles.txLabel, { color: colors.foreground }]}>
                          {txLabel(tx.type, tx.reason)}
                        </Text>
                        <Text style={[styles.txDate, { color: colors.mutedForeground }]}>
                          {formatDate(tx.createdAt)}
                        </Text>
                      </View>
                      <Text style={[styles.txCredits, { color }]}>
                        {isPositive ? "+" : ""}{tx.credits}
                      </Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </>
        )}

        {/* ── Defaults ── */}
        <SectionHeader title="DEFAULTS" />
        <View style={styles.group}>
          <SettingRow
            label="Default Category"
            value={settings.defaultCategory}
            onPress={() => setShowCategoryPicker(true)}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <SettingRow
            label="Default Intensity"
            value={settings.defaultIntensity}
            onPress={() => setShowIntensityPicker(true)}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <SettingRow
            label="Default Personality"
            value={settings.defaultPersonality}
            onPress={() => setShowPersonalityPicker(true)}
          />
        </View>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          These values are pre-selected when you start a new roast.
        </Text>

        {/* ── Data ── */}
        <SectionHeader title="DATA" />
        <View style={styles.group}>
          <DangerRow label="Clear All Saved Roasts" onPress={handleClearHistory} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleResetOnboarding}
            activeOpacity={0.7}
          >
            <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>Reset Welcome Screen</Text>
            <Feather name="refresh-cw" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* ── About ── */}
        <SectionHeader title="ABOUT" />
        <View
          style={[
            styles.aboutCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <LinearGradient
            colors={["#1a0533", "#2a0a54"]}
            style={styles.aboutGradient}
          >
            <View style={styles.aboutLogoRow}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.aboutLogo}
              />
              <View>
                <Text style={styles.aboutName}>Brutal Mirror</Text>
                <Text style={styles.aboutTagline}>Brutal feedback. Better results.</Text>
              </View>
            </View>
            <View style={[styles.aboutDivider, { backgroundColor: "#7c3aed20" }]} />
            <Text style={styles.aboutVersion}>Version: MVP 1.0</Text>
            <Text style={styles.aboutDisclaimer}>
              AI feedback can be wrong. Use judgment before acting on any advice.
              Brutal Mirror is a creative tool, not a professional service.
            </Text>
          </LinearGradient>
        </View>

        <View style={[styles.group, { marginTop: 8, backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.linkRow, { backgroundColor: colors.card }]}
            onPress={() => Linking.openURL("https://orami.io/privacy")}
            activeOpacity={0.7}
          >
            <View style={styles.linkLeft}>
              <Feather name="shield" size={15} color={colors.mutedForeground} />
              <Text style={[styles.linkLabel, { color: colors.foreground }]}>Privacy Policy</Text>
            </View>
            <Feather name="external-link" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={[styles.linkRow, { backgroundColor: colors.card }]}
            onPress={() => Linking.openURL("https://orami.io/terms")}
            activeOpacity={0.7}
          >
            <View style={styles.linkLeft}>
              <Feather name="file-text" size={15} color={colors.mutedForeground} />
              <Text style={[styles.linkLabel, { color: colors.foreground }]}>Terms of Service</Text>
            </View>
            <Feather name="external-link" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  content: { paddingHorizontal: 20, paddingTop: 24, gap: 8 },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  settingValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 0,
  },
  dangerLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", paddingHorizontal: 4, lineHeight: 18 },
  accountIconRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  accountIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  creditBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  creditBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  creditBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  buyCreditsRow: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  buyCreditsGradient: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  buyCreditsLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  buyCreditsIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buyCreditsTitle: { color: "#f3e8ff", fontSize: 15, fontFamily: "Inter_700Bold" },
  buyCreditsSubtitle: { color: "#a78bfa", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  buyCreditsChevron: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#8b5cf620",
    alignItems: "center",
    justifyContent: "center",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  txIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  txMiddle: { flex: 1, gap: 2 },
  txLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  txDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  txCredits: { fontSize: 14, fontFamily: "Inter_700Bold" },
  signInCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  signInGradient: { borderRadius: 16 },
  signInGradientInner: { padding: 20, gap: 16 },
  signInTextBlock: { gap: 6 },
  signInCardTitle: {
    color: "#f3e8ff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  signInCardBody: {
    color: "#a78bfa",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  signInCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 14,
  },
  signInCardBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  aboutCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  aboutGradient: { padding: 20, gap: 14, borderRadius: 16 },
  aboutLogoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  aboutLogo: { width: 44, height: 44, borderRadius: 12 },
  aboutName: {
    color: "#f3e8ff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  aboutTagline: {
    color: "#a78bfa",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  aboutDivider: { height: StyleSheet.hairlineWidth },
  aboutVersion: {
    color: "#c4b5fd",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  aboutDisclaimer: {
    color: "#9ca3af",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  linkLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    gap: 8,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 8 },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  sheetOptionText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
