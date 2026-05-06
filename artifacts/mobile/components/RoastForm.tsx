import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useRoast } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

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
  { label: "Honest", desc: "Direct but professional" },
  { label: "Harsh", desc: "Sharp and blunt" },
  { label: "Brutal", desc: "Savage and witty" },
  { label: "Career-ending", desc: "Extremely sharp & funny" },
];

const MAX_LENGTH = 3000;
const MIN_LENGTH = 20;

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}

function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: PickerModalProps) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View
          style={[
            styles.modalSheet,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {title}
          </Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.modalOption,
                {
                  backgroundColor:
                    selected === opt ? colors.primary + "20" : "transparent",
                  borderColor:
                    selected === opt ? colors.primary : "transparent",
                },
              ]}
              onPress={() => {
                onSelect(opt);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  {
                    color:
                      selected === opt ? colors.primary : colors.foreground,
                    fontWeight: selected === opt ? "600" : "400",
                  },
                ]}
              >
                {opt}
              </Text>
              {selected === opt && (
                <Feather name="check" size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

interface IntensityPickerModalProps {
  visible: boolean;
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}

function IntensityPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: IntensityPickerModalProps) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View
          style={[
            styles.modalSheet,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            Intensity Level
          </Text>
          {INTENSITIES.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.intensityOption,
                {
                  backgroundColor:
                    selected === item.label
                      ? colors.primary + "20"
                      : colors.secondary,
                  borderColor:
                    selected === item.label ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                onSelect(item.label);
                onClose();
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.intensityLabel,
                    {
                      color:
                        selected === item.label
                          ? colors.primary
                          : colors.foreground,
                    },
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[styles.intensityDesc, { color: colors.mutedForeground }]}
                >
                  {item.desc}
                </Text>
              </View>
              {selected === item.label && (
                <Feather name="check" size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

interface RoastFormProps {
  onResultReady?: () => void;
}

export function RoastForm({ onResultReady }: RoastFormProps) {
  const colors = useColors();
  const { generateRoast, isLoading, error } = useRoast();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [intensity, setIntensity] = useState("Brutal");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showIntensityModal, setShowIntensityModal] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const isTooShort = charCount < MIN_LENGTH && charCount > 0;

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
            { backgroundColor: colors.card, borderColor: colors.border, flex: 1 },
          ]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={[styles.selectorLabel, { color: colors.mutedForeground }]}>
            Category
          </Text>
          <View style={styles.selectorValueRow}>
            <Text
              style={[styles.selectorValue, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {category}
            </Text>
            <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.selectorButton,
            { backgroundColor: colors.card, borderColor: colors.border, flex: 1 },
          ]}
          onPress={() => setShowIntensityModal(true)}
        >
          <Text style={[styles.selectorLabel, { color: colors.mutedForeground }]}>
            Intensity
          </Text>
          <View style={styles.selectorValueRow}>
            <Text style={[styles.selectorValue, { color: colors.primary }]}>
              {intensity}
            </Text>
            <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.textAreaContainer,
          {
            backgroundColor: colors.card,
            borderColor:
              validationError || error || isOverLimit
                ? colors.destructive
                : isTooShort
                ? colors.primary + "60"
                : colors.border,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
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
          maxLength={MAX_LENGTH + 10}
        />
        <View style={styles.charCountRow}>
          <Text
            style={[
              styles.charCount,
              {
                color:
                  isOverLimit
                    ? colors.destructive
                    : charCount > MAX_LENGTH * 0.8
                    ? "#f59e0b"
                    : colors.mutedForeground,
              },
            ]}
          >
            {charCount}/{MAX_LENGTH}
          </Text>
        </View>
      </View>

      {(validationError || error) && (
        <View
          style={[styles.errorBox, { backgroundColor: colors.destructive + "15" }]}
        >
          <Feather name="alert-circle" size={14} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {validationError || error}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.85}
        style={{ marginTop: 4 }}
      >
        <LinearGradient
          colors={
            isLoading
              ? ["#4c1d95", "#4c1d95"]
              : ["#7c3aed", "#8b5cf6", "#a78bfa"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.submitButton,
            { opacity: isLoading ? 0.7 : 1 },
          ]}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.submitText}>Analyzing…</Text>
            </View>
          ) : (
            <View style={styles.loadingRow}>
              <Feather name="zap" size={18} color="#fff" />
              <Text style={styles.submitText}>Roast Me</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  selectorButton: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  selectorLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  textArea: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    padding: 16,
    minHeight: 140,
    maxHeight: 220,
  },
  charCountRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: "flex-end",
  },
  charCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  submitButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    gap: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalOptionText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  intensityOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  intensityLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  intensityDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
