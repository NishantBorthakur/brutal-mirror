import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
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
import { useRoast } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";
import { ExampleChips } from "./ExampleChips";
import { LoadingMessages } from "./LoadingMessages";

export interface RoastFormHandle {
  reset: () => void;
  fill: (category: string, content: string) => void;
}

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
  { label: "Honest", desc: "Direct but professional", color: "#6b7280", emoji: "🙂" },
  { label: "Harsh", desc: "Sharp and unfiltered", color: "#f59e0b", emoji: "😬" },
  { label: "Brutal", desc: "Savage, witty, uncomfortable", color: "#ef4444", emoji: "💀" },
  { label: "Career-ending", desc: "Maximum destruction", color: "#8b5cf6", emoji: "☠️" },
];

const PERSONALITIES = [
  { label: "Savage Mentor", desc: "Brutal but growth-focused", icon: "🧠", color: "#8b5cf6" },
  { label: "Startup Investor", desc: "Market, positioning, differentiation", icon: "💰", color: "#f59e0b" },
  { label: "Creative Director", desc: "Branding, taste, originality", icon: "🎨", color: "#ec4899" },
  { label: "Dating Coach", desc: "Attraction, confidence, personality", icon: "💘", color: "#ef4444" },
  { label: "Resume Recruiter", desc: "Credibility, outcomes, hiring value", icon: "📋", color: "#22c55e" },
  { label: "Internet Troll, but useful", desc: "Funnier, meaner, still constructive", icon: "💀", color: "#6b7280" },
];

const MAX_LENGTH = 3000;
const MIN_LENGTH = 20;

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
  onSelect: (val: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
          {options.map((opt) => {
            const isSelected = selected === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.modalOption,
                  {
                    backgroundColor: isSelected ? colors.primary + "18" : "transparent",
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { onSelect(opt); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalOptionText, { color: isSelected ? colors.primary : colors.foreground }]}>
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

function IntensityPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Intensity Level</Text>
          {INTENSITIES.map((item) => {
            const isSelected = selected === item.label;
            return (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.richOption,
                  {
                    backgroundColor: isSelected ? item.color + "18" : colors.secondary,
                    borderColor: isSelected ? item.color : colors.border,
                  },
                ]}
                onPress={() => { onSelect(item.label); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={styles.richEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.richLabel, { color: isSelected ? item.color : colors.foreground }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.richDesc, { color: colors.mutedForeground }]}>
                    {item.desc}
                  </Text>
                </View>
                {isSelected && <Feather name="check" size={16} color={item.color} />}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PersonalityPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Roast Personality</Text>
          {PERSONALITIES.map((item) => {
            const isSelected = selected === item.label;
            return (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.richOption,
                  {
                    backgroundColor: isSelected ? item.color + "18" : colors.secondary,
                    borderColor: isSelected ? item.color : colors.border,
                  },
                ]}
                onPress={() => { onSelect(item.label); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={styles.richEmoji}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.richLabel, { color: isSelected ? item.color : colors.foreground }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.richDesc, { color: colors.mutedForeground }]}>
                    {item.desc}
                  </Text>
                </View>
                {isSelected && <Feather name="check" size={16} color={item.color} />}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export interface RoastFormProps {
  onResultReady?: () => void;
  onNeedAuth?: () => void;
  onNoCredits?: () => void;
}

export const RoastForm = forwardRef<RoastFormHandle, RoastFormProps>(
  function RoastForm({ onResultReady, onNeedAuth, onNoCredits }, ref) {
    const colors = useColors();
    const { generateRoast, isLoading, error, settings, settingsLoaded } = useRoast();
    const { session, credits } = useAuth();

    const [category, setCategory] = useState(settings.defaultCategory);
    const [intensity, setIntensity] = useState(settings.defaultIntensity);
    const [personality, setPersonality] = useState(settings.defaultPersonality);
    const [content, setContent] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showIntensityModal, setShowIntensityModal] = useState(false);
    const [showPersonalityModal, setShowPersonalityModal] = useState(false);

    const buttonScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (!content) {
        setCategory(settings.defaultCategory);
        setIntensity(settings.defaultIntensity);
        setPersonality(settings.defaultPersonality);
      }
    }, [settings.defaultCategory, settings.defaultIntensity, settings.defaultPersonality]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        setContent("");
        setValidationError(null);
      },
      fill: (cat: string, cnt: string) => {
        setCategory(cat);
        setContent(cnt);
        setValidationError(null);
      },
    }));

    const charCount = content.length;
    const isOverLimit = charCount > MAX_LENGTH;
    const currentIntensity = INTENSITIES.find((i) => i.label === intensity);
    const currentPersonality = PERSONALITIES.find((p) => p.label === personality);

    const pressIn = () =>
      Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
    const pressOut = () =>
      Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

    const isSpecialError = error === "AUTH_REQUIRED" || error === "OUT_OF_CREDITS";

    const handleSubmit = async () => {
      // Auth/credits pre-check — show modals instead of API errors
      if (!session) {
        onNeedAuth?.();
        return;
      }
      if (credits <= 0) {
        onNoCredits?.();
        return;
      }

      if (charCount < MIN_LENGTH) {
        setValidationError(
          charCount === 0
            ? "Paste something to roast first."
            : `Your input is too short to destroy properly. Add at least ${MIN_LENGTH} characters.`
        );
        return;
      }
      if (isOverLimit) {
        setValidationError(`Maximum ${MAX_LENGTH} characters allowed.`);
        return;
      }
      setValidationError(null);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await generateRoast(category, intensity, content, personality);
      onResultReady?.();
    };

    const textAreaBorderColor = (() => {
      if (validationError || (error && !isSpecialError) || isOverLimit) return colors.destructive;
      if (isFocused) return colors.primary;
      return colors.border;
    })();

    return (
      <View style={styles.container}>
        <PickerModal
          visible={showCategoryModal}
          title="What are we roasting?"
          options={CATEGORIES}
          selected={category}
          onSelect={setCategory}
          onClose={() => setShowCategoryModal(false)}
        />
        <IntensityPickerModal
          visible={showIntensityModal}
          selected={intensity}
          onSelect={setIntensity}
          onClose={() => setShowIntensityModal(false)}
        />
        <PersonalityPickerModal
          visible={showPersonalityModal}
          selected={personality}
          onSelect={setPersonality}
          onClose={() => setShowPersonalityModal(false)}
        />

        {/* Row 1: Category + Intensity */}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.selectorBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectorLabel, { color: colors.mutedForeground }]}>CATEGORY</Text>
            <View style={styles.selectorValueRow}>
              <Text style={[styles.selectorValue, { color: colors.foreground }]} numberOfLines={1}>
                {category}
              </Text>
              <Feather name="chevron-down" size={13} color={colors.mutedForeground} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectorBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowIntensityModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectorLabel, { color: colors.mutedForeground }]}>INTENSITY</Text>
            <View style={styles.selectorValueRow}>
              <Text style={[styles.selectorValue, { color: currentIntensity?.color ?? colors.primary }]}>
                {intensity}
              </Text>
              <Feather name="chevron-down" size={13} color={colors.mutedForeground} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Row 2: Personality */}
        <TouchableOpacity
          style={[
            styles.personalityBtn,
            {
              backgroundColor: colors.card,
              borderColor: currentPersonality ? currentPersonality.color + "40" : colors.border,
            },
          ]}
          onPress={() => setShowPersonalityModal(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectorLabel, { color: colors.mutedForeground }]}>ROAST PERSONALITY</Text>
          <View style={styles.selectorValueRow}>
            <Text style={styles.personalityEmoji}>{currentPersonality?.icon}</Text>
            <Text
              style={[styles.selectorValue, { color: currentPersonality?.color ?? colors.primary, flex: 1 }]}
              numberOfLines={1}
            >
              {personality}
            </Text>
            <Feather name="chevron-down" size={13} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>

        {/* Example chips */}
        <ExampleChips
          onSelect={(cat, cnt) => {
            setCategory(cat);
            setContent(cnt);
            setValidationError(null);
          }}
        />

        {/* Textarea */}
        <View
          style={[
            styles.textAreaContainer,
            { backgroundColor: colors.card, borderColor: textAreaBorderColor },
          ]}
        >
          <Text style={[styles.textAreaHelper, { color: colors.mutedForeground }]}>
            Paste the thing you secretly know needs work.
          </Text>
          <TextInput
            style={[styles.textArea, { color: colors.foreground }]}
            placeholder="Your bio, idea, profile, resume…"
            placeholderTextColor={colors.mutedForeground + "80"}
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={(t) => { setContent(t); setValidationError(null); }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={MAX_LENGTH + 10}
            selectionColor={colors.primary}
          />
          <View style={styles.charCountRow}>
            <Text
              style={[
                styles.charCount,
                {
                  color: isOverLimit
                    ? colors.destructive
                    : charCount > MAX_LENGTH * 0.85
                    ? "#f59e0b"
                    : colors.mutedForeground,
                },
              ]}
            >
              {charCount.toLocaleString()}/{MAX_LENGTH.toLocaleString()}
            </Text>
          </View>
        </View>

        {(validationError || (error && !isSpecialError)) && (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "30" },
            ]}
          >
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {validationError ?? error}
            </Text>
          </View>
        )}

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            onPress={handleSubmit}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={isLoading}
            activeOpacity={1}
          >
            <LinearGradient
              colors={isLoading ? ["#3b1a6e", "#4c1d95"] : ["#6d28d9", "#8b5cf6", "#a78bfa"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitButton, { opacity: isLoading ? 0.85 : 1 }]}
            >
              {isLoading ? (
                <LoadingMessages />
              ) : (
                <View style={styles.btnContent}>
                  <Feather name="zap" size={18} color="#fff" />
                  <Text style={styles.submitText}>Roast Me</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: { gap: 12 },
  row: { flexDirection: "row", gap: 10 },
  selectorBtn: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, gap: 5 },
  personalityBtn: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 5 },
  selectorLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  selectorValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  selectorValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", flexShrink: 1 },
  personalityEmoji: { fontSize: 16 },
  textAreaContainer: { borderRadius: 14, borderWidth: 1.5, overflow: "hidden" },
  textAreaHelper: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    letterSpacing: 0.1,
  },
  textArea: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 23,
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 130,
    maxHeight: 220,
  },
  charCountRow: { paddingHorizontal: 16, paddingBottom: 12, alignItems: "flex-end" },
  charCount: { fontSize: 11, fontFamily: "Inter_500Medium" },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 19 },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
  },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  submitText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    gap: 8,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 8 },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalOptionText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  richOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  richEmoji: { fontSize: 20, width: 28, textAlign: "center" },
  richLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  richDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
});
