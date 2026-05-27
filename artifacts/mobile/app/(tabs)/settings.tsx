import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
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

import { ONBOARDING_KEY } from "@/components/OnboardingCard";
import { useToast } from "@/components/Toast";
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

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, clearHistory } = useRoast();
  const { showToast } = useToast();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showIntensityPicker, setShowIntensityPicker] = useState(false);
  const [showPersonalityPicker, setShowPersonalityPicker] = useState(false);

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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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
    color: "#6d28d9",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  aboutDisclaimer: {
    color: "#6d28d9",
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
