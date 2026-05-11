import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { type RoastResult } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

interface ResultCardProps {
  icon: string;
  accentColor: string;
  title: string;
  delay?: number;
  children: React.ReactNode;
}

function ResultCard({
  icon,
  accentColor,
  title,
  delay = 0,
  children,
}: ResultCardProps) {
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />
      <View style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.cardIconBg,
              { backgroundColor: accentColor + "18" },
            ]}
          >
            <Feather name={icon as any} size={14} color={accentColor} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>
            {title}
          </Text>
        </View>
        <View style={styles.cardContent}>{children}</View>
      </View>
    </Animated.View>
  );
}

function NewRoastButton({
  onPress,
  variant = "outline",
}: {
  onPress?: () => void;
  variant?: "outline" | "filled";
}) {
  const colors = useColors();
  if (!onPress) return null;
  return (
    <TouchableOpacity
      style={[
        styles.newRoastButton,
        variant === "filled"
          ? {
              backgroundColor: colors.primary + "18",
              borderColor: colors.primary + "40",
            }
          : {
              backgroundColor: "transparent",
              borderColor: colors.border,
            },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Feather name="refresh-cw" size={15} color={colors.primary} />
      <Text style={[styles.newRoastButtonText, { color: colors.primary }]}>
        Start New Roast
      </Text>
    </TouchableOpacity>
  );
}

interface Props {
  result: RoastResult;
  meta?: {
    category: string;
    intensity: string;
    originalPrompt?: string;
  } | null;
  onNewRoast?: () => void;
}

const INTENSITY_COLORS: Record<string, string> = {
  Honest: "#6b7280",
  Harsh: "#f59e0b",
  Brutal: "#ef4444",
  "Career-ending": "#8b5cf6",
};

export function RoastResultView({ result, meta, onNewRoast }: Props) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCopy = async () => {
    const lines: string[] = [
      `🔥 BRUTAL MIRROR`,
      meta ? `Category: ${meta.category} | Intensity: ${meta.intensity}` : "",
      ``,
      `💀 THE ROAST`,
      result.brutalRoast,
      ``,
      `🔬 DIAGNOSIS`,
      result.actualDiagnosis,
      ``,
      `⚠️ BIGGEST WEAKNESSES`,
      ...result.biggestWeaknesses.map((w, i) => `${i + 1}. ${w}`),
      ``,
      `🔧 3 FIXES`,
      ...result.threeFixes.map((f, i) => `${i + 1}. ${f}`),
      ``,
      `✨ IMPROVED VERSION`,
      result.improvedVersion,
    ];

    await Clipboard.setStringAsync(lines.join("\n").trim());
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const intensityColor = meta
    ? (INTENSITY_COLORS[meta.intensity] ?? colors.primary)
    : colors.primary;

  return (
    <View style={styles.container}>
      {/* ── Header: label + badges on left, copy button on right ── */}
      <Animated.View style={{ opacity: headerFade }}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
              YOUR ROAST
            </Text>
            {meta && (
              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.metaBadge,
                    { backgroundColor: colors.primary + "18" },
                  ]}
                >
                  <Text style={[styles.metaText, { color: colors.primary }]}>
                    {meta.category}
                  </Text>
                </View>
                <View
                  style={[
                    styles.metaBadge,
                    { backgroundColor: intensityColor + "18" },
                  ]}
                >
                  <Text style={[styles.metaText, { color: intensityColor }]}>
                    {meta.intensity}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Only Copy button in top-right */}
          <TouchableOpacity
            style={[
              styles.copyBtn,
              {
                backgroundColor: copied ? "#22c55e18" : colors.card,
                borderColor: copied ? "#22c55e40" : colors.border,
              },
            ]}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            <Feather
              name={copied ? "check" : "copy"}
              size={15}
              color={copied ? "#22c55e" : colors.mutedForeground}
            />
            <Text
              style={[
                styles.copyBtnText,
                { color: copied ? "#22c55e" : colors.mutedForeground },
              ]}
            >
              {copied ? "Copied!" : "Copy"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* New Roast button — its own row below the header */}
        <NewRoastButton onPress={onNewRoast} variant="outline" />
      </Animated.View>

      {/* ── Original Prompt card (if available) ── */}
      {meta?.originalPrompt && (
        <ResultCard
          icon="file-text"
          accentColor="#6b7280"
          title="ORIGINAL PROMPT"
          delay={0}
        >
          <Text style={[styles.promptText, { color: colors.mutedForeground }]}>
            {meta.originalPrompt}
          </Text>
        </ResultCard>
      )}

      <ResultCard icon="zap" accentColor="#ef4444" title="THE ROAST" delay={60}>
        <Text style={[styles.roastText, { color: colors.foreground }]}>
          {result.brutalRoast}
        </Text>
      </ResultCard>

      <ResultCard
        icon="activity"
        accentColor="#f59e0b"
        title="ACTUAL DIAGNOSIS"
        delay={120}
      >
        <Text style={[styles.bodyText, { color: colors.foreground }]}>
          {result.actualDiagnosis}
        </Text>
      </ResultCard>

      <ResultCard
        icon="alert-triangle"
        accentColor="#ef4444"
        title="BIGGEST WEAKNESSES"
        delay={180}
      >
        {result.biggestWeaknesses.map((w, i) => (
          <View key={i} style={styles.listItem}>
            <View style={[styles.listDot, { backgroundColor: "#ef4444" }]} />
            <Text
              style={[styles.bodyText, { color: colors.foreground, flex: 1 }]}
            >
              {w}
            </Text>
          </View>
        ))}
      </ResultCard>

      <ResultCard
        icon="tool"
        accentColor="#22c55e"
        title="3 FIXES"
        delay={240}
      >
        {result.threeFixes.map((f, i) => (
          <View key={i} style={styles.listItem}>
            <View
              style={[
                styles.fixNumberBadge,
                { backgroundColor: "#22c55e18" },
              ]}
            >
              <Text style={[styles.fixNumber, { color: "#22c55e" }]}>
                {i + 1}
              </Text>
            </View>
            <Text
              style={[styles.bodyText, { color: colors.foreground, flex: 1 }]}
            >
              {f}
            </Text>
          </View>
        ))}
      </ResultCard>

      <ResultCard
        icon="star"
        accentColor={colors.primary}
        title="IMPROVED VERSION"
        delay={300}
      >
        <View
          style={[
            styles.improvedBox,
            {
              backgroundColor: colors.primary + "08",
              borderColor: colors.primary + "25",
            },
          ]}
        >
          <Text style={[styles.improvedText, { color: colors.foreground }]}>
            {result.improvedVersion}
          </Text>
        </View>
      </ResultCard>

      {/* ── Bottom New Roast button ── */}
      <NewRoastButton onPress={onNewRoast} variant="filled" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  resultLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
    minHeight: 40,
  },
  copyBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  newRoastButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 48,
  },
  newRoastButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
  },
  cardAccentBar: {
    width: 3,
  },
  cardInner: {
    flex: 1,
    padding: 16,
    paddingLeft: 14,
    gap: 12,
    minWidth: 0,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardIconBg: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    flexShrink: 1,
  },
  cardContent: {
    gap: 10,
  },
  promptText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    fontStyle: "italic",
  },
  roastText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 25,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  listDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 9,
    flexShrink: 0,
  },
  fixNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  fixNumber: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  improvedBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  improvedText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 23,
    fontStyle: "italic",
  },
});
