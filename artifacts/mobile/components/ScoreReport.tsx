import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { type ScoreReport as ScoreReportType } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

interface BarProps {
  label: string;
  value: number;
  color: string;
  delay: number;
}

function ScoreBar({ label, value, color, delay }: BarProps) {
  const colors = useColors();
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.min(100, Math.max(0, value)),
      duration: 700,
      delay,
      useNativeDriver: false,
    }).start();
  }, [value]);

  return (
    <View style={styles.barRow}>
      <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View
        style={[styles.barTrack, { backgroundColor: colors.secondary }]}
      >
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: color,
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <Text style={[styles.barScore, { color }]}>{value}</Text>
    </View>
  );
}

const METRICS = [
  { key: "clarity" as const, label: "Clarity", color: "#3b82f6" },
  { key: "originality" as const, label: "Originality", color: "#f59e0b" },
  { key: "marketability" as const, label: "Marketability", color: "#22c55e" },
  { key: "cringeLevel" as const, label: "Cringe Level", color: "#ef4444" },
  { key: "fixability" as const, label: "Fixability", color: "#8b5cf6" },
];

interface Props {
  scores: ScoreReportType;
  delay?: number;
}

export function ScoreReport({ scores, delay = 0 }: Props) {
  const colors = useColors();
  const overallAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(overallAnim, {
      toValue: scores.overallRoastScore,
      duration: 800,
      delay,
      useNativeDriver: false,
    }).start();
  }, [scores.overallRoastScore]);

  const overall = Math.min(100, Math.max(0, scores.overallRoastScore));
  const overallColor =
    overall >= 80 ? "#ef4444" : overall >= 60 ? "#f59e0b" : "#8b5cf6";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: "#8b5cf6" }]} />
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconBg,
              { backgroundColor: "#8b5cf618" },
            ]}
          >
            <Text style={styles.icon}>📊</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>
            ROAST REPORT
          </Text>
        </View>

        {/* Overall score — large display */}
        <View
          style={[
            styles.overallBox,
            {
              backgroundColor: overallColor + "10",
              borderColor: overallColor + "30",
            },
          ]}
        >
          <View style={styles.overallLeft}>
            <Text
              style={[styles.overallLabel, { color: colors.mutedForeground }]}
            >
              OVERALL ROAST SCORE
            </Text>
            <Text style={[styles.overallSub, { color: colors.mutedForeground }]}>
              {overall >= 80
                ? "Thoroughly roasted"
                : overall >= 60
                ? "Deserves the roast"
                : overall >= 40
                ? "Could use work"
                : "Actually not bad"}
            </Text>
          </View>
          <Text style={[styles.overallScore, { color: overallColor }]}>
            {overall}
          </Text>
        </View>

        {/* Score bars */}
        <View style={styles.barsContainer}>
          {METRICS.map((m, i) => (
            <ScoreBar
              key={m.key}
              label={m.label}
              value={scores[m.key]}
              color={m.color}
              delay={delay + 100 + i * 80}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
  },
  accentBar: {
    width: 3,
  },
  inner: {
    flex: 1,
    padding: 16,
    paddingLeft: 14,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBg: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 14,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  overallBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  overallLeft: {
    flex: 1,
    gap: 3,
  },
  overallLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  overallSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  overallScore: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    lineHeight: 44,
  },
  barsContainer: {
    gap: 10,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  barLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    width: 90,
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  barScore: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    width: 28,
    textAlign: "right",
    flexShrink: 0,
  },
});
