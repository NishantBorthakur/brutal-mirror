import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  forwardRef,
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

import { useRoast } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";
import { LoadingMessages } from "./LoadingMessages";

export interface RoastFormHandle {
  reset: () => void;
}

const CATEGORIES = [
  "Instagram Bio",
  "Startup Idea",
  "Dating Profile",
  "Resume Summary",
  "Business Name",
  "YouTube Channel Idea",
  "Personal Goal",
  "Mobile App Idea",
  "Other",
];

const INTENSITIES = [
  {
    label: "Honest",
    desc: "Direct but professional",
    color: "#6b7280",
    emoji: "🙂",
  },
  {
    label: "Harsh",
    desc: "Sharp and unfiltered",
    color: "#f59e0b",
    emoji: "😬",
  },
  {
    label: "Brutal",
    desc: "Savage, witty, uncomfortable",
    color: "#ef4444",
    emoji: "💀",
  },
  {
    label: "Career-ending",
    desc: "Maximum destruction",
    color: "#8b5cf6",
    emoji: "☠️",
  },
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
          style={[
            styles.modalSheet,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => {}}
        >
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {title}
          </Text>
          {options.map((opt) => {
            const isSelected = selected === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.modalOption,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + "18"
                      : "transparent",
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    { color: isSelected ? colors.primary : colors.foreground },
                  ]}
                >
                  {opt}
                </Text>
                {isSelected && (
                  <Feather name="check" size={16} color={colors.primary} />
                )}
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
          style={[
            styles.modalSheet,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => {}}
        >
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            Intensity Level
          </Text>
          {INTENSITIES.map((item) => {
            const isSelected = selected === item.label;
            return (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.intensityOption,
                  {
                    backgroundColor: isSelected
                      ? item.color + "18"
                      : colors.secondary,
                    borderColor: isSelected ? item.color : colors.border,
                  },
                ]}
                onPress={() => {
                  onSelect(item.label);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.intensityEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.intensityLabel,
                      { color: isSelected ? item.color : colors.foreground },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.intensityDesc,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {item.desc}
                  </Text>
                </View>
                {isSelected && (
                  <Feather name="check" size={16} color={item.color} />
                )}
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
}

export const RoastForm = forwardRef<RoastFormHandle, RoastFormProps>(
  function RoastForm({ onResultReady }, ref) {
    const colors = useColors();
    const { generateRoast, isLoading, error } = useRoast();

    const [category, setCategory] = useState(CATEGORIES[0]);
    const [intensity, setIntensity] = useState("Brutal");
    const [content, setContent] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showIntensityModal, setShowIntensityModal] = useState(false);

    const buttonScale = useRef(new Animated.Value(1)).current;

    useImperativeHandle(ref, () => ({
      reset: () => {
        setContent("");
        setValidationError(null);
      },
    }));

    const charCount = content.length;
    const isOverLimit = charCount > MAX_LENGTH;
    const isTooShort = charCount < MIN_LENGTH && charCount > 0;
    const currentIntensity = INTENSITIES.find((i) => i.label === intensity);

    const pressIn = () =>
      Animated.spring(buttonScale, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 40,
      }).start();

    const pressOut = () =>
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
      }).start();

    const handleSubmit = async () => {
      if (charCount < MIN_LENGTH) {
        setValidationError(`Enter at least ${MIN_LENGTH} characters`);
        return;
      }
      if (isOverLimit) {
        setValidationError(`Maximum ${MAX_LENGTH} characters allowed`);
        return;
      }
      setValidationError(null);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await generateRoast(category, intensity, content);
      onResultReady?.();
    };

    const textAreaBorderColor = (() => {
      if (validationError || error || isOverLimit) return colors.destructive;
      if (isFocused) return colors.primary;
      if (isTooShort) return colors.primary + "50";
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

        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.selectorButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.selectorLabel, { color: colors.mutedForeground }]}
            >
              Category
            </Text>
            <View style={styles.selectorValueRow}>
              <Text
                style={[styles.selectorValue, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {category}
              </Text>
              <Feather
                name="chevron-down"
                size={13}
                color={colors.mutedForeground}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setShowIntensityModal(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.selectorLabel, { color: colors.mutedForeground }]}
            >
              Intensity
            </Text>
            <View style={styles.selectorValueRow}>
              <Text
                style={[
                  styles.selectorValue,
                  { color: currentIntensity?.color ?? colors.primary },
                ]}
              >
                {intensity}
              </Text>
              <Feather
                name="chevron-down"
                size={13}
                color={colors.mutedForeground}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.textAreaContainer,
            {
              backgroundColor: colors.card,
              borderColor: textAreaBorderColor,
            },
          ]}
        >
          <TextInput
            style={[styles.textArea, { color: colors.foreground }]}
            placeholder="Paste what you want brutally judged…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={(t) => {
              setContent(t);
              setValidationError(null);
            }}
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

        {(validationError || error) && (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: colors.destructive + "12",
                borderColor: colors.destructive + "30",
              },
            ]}
          >
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {validationError || error}
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
              colors={
                isLoading
                  ? ["#3b1a6e", "#4c1d95"]
                  : ["#6d28d9", "#8b5cf6", "#a78bfa"]
              }
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
  container: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  selectorButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 5,
  },
  selectorLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  selectorValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  selectorValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  textAreaContainer: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  textArea: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 23,
    padding: 16,
    minHeight: 150,
    maxHeight: 240,
  },
  charCountRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: "flex-end",
  },
  charCount: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 19,
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    gap: 8,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalOptionText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  intensityOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  intensityEmoji: {
    fontSize: 22,
    width: 28,
    textAlign: "center",
  },
  intensityLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  intensityDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
});
