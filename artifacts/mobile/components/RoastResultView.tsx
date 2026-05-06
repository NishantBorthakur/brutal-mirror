import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { type RoastResult } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

interface ResultCardProps {
  icon: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}

function ResultCard({ icon, iconColor, title, children }: ResultCardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[styles.cardIconBg, { backgroundColor: iconColor + "20" }]}
        >
          <Feather name={icon as any} size={16} color={iconColor} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

interface Props {
  result: RoastResult;
  meta?: { category: string; intensity: string } | null;
  onNewRoast?: () => void;
}

export function RoastResultView({ result, meta, onNewRoast }: Props) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = [
      `🔥 BRUTAL MIRROR ROAST`,
      meta ? `Category: ${meta.category} | Intensity: ${meta.intensity}` : "",
      "",
      `💀 THE ROAST`,
      result.brutalRoast,
      "",
      `🔬 ACTUAL DIAGNOSIS`,
      result.actualDiagnosis,
      "",
      `⚠️ BIGGEST WEAKNESSES`,
      ...result.biggestWeaknesses.map((w, i) => `${i + 1}. ${w}`),
      "",
      `🔧 3 FIXES`,
      ...result.threeFixes.map((f, i) => `${i + 1}. ${f}`),
      "",
      `✨ IMPROVED VERSION`,
      result.improvedVersion,
    ]
      .filter((l) => l !== null)
      .join("\n");

    await Clipboard.setStringAsync(text);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={[styles.heading, { color: colors.foreground }]}>
          Your Roast
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleCopy}
          >
            <Feather
              name={copied ? "check" : "copy"}
              size={16}
              color={copied ? "#22c55e" : colors.mutedForeground}
            />
          </TouchableOpacity>
          {onNewRoast && (
            <TouchableOpacity
              style={[
                styles.newRoastBtn,
                { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" },
              ]}
              onPress={onNewRoast}
            >
              <Feather name="refresh-cw" size={14} color={colors.primary} />
              <Text style={[styles.newRoastText, { color: colors.primary }]}>
                New Roast
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {meta && (
        <View style={styles.metaRow}>
          <View
            style={[styles.metaBadge, { backgroundColor: colors.primary + "20" }]}
          >
            <Text style={[styles.metaText, { color: colors.primary }]}>
              {meta.category}
            </Text>
          </View>
          <View
            style={[styles.metaBadge, { backgroundColor: colors.muted }]}
          >
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {meta.intensity}
            </Text>
          </View>
        </View>
      )}

      <ResultCard icon="zap" iconColor="#ef4444" title="THE ROAST">
        <Text style={[styles.roastText, { color: colors.foreground }]}>
          {result.brutalRoast}
        </Text>
      </ResultCard>

      <ResultCard icon="activity" iconColor="#f59e0b" title="ACTUAL DIAGNOSIS">
        <Text style={[styles.bodyText, { color: colors.foreground }]}>
          {result.actualDiagnosis}
        </Text>
      </ResultCard>

      <ResultCard icon="alert-triangle" iconColor="#ef4444" title="BIGGEST WEAKNESSES">
        {result.biggestWeaknesses.map((w, i) => (
          <View key={i} style={styles.listItem}>
            <View
              style={[styles.listDot, { backgroundColor: "#ef4444" }]}
            />
            <Text style={[styles.bodyText, { color: colors.foreground, flex: 1 }]}>
              {w}
            </Text>
          </View>
        ))}
      </ResultCard>

      <ResultCard icon="tool" iconColor="#22c55e" title="3 FIXES">
        {result.threeFixes.map((f, i) => (
          <View key={i} style={styles.listItem}>
            <Text style={[styles.fixNumber, { color: "#22c55e" }]}>
              {i + 1}
            </Text>
            <Text style={[styles.bodyText, { color: colors.foreground, flex: 1 }]}>
              {f}
            </Text>
          </View>
        ))}
      </ResultCard>

      <ResultCard icon="star" iconColor={colors.primary} title="IMPROVED VERSION">
        <Text style={[styles.improvedText, { color: colors.foreground }]}>
          {result.improvedVersion}
        </Text>
      </ResultCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  heading: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  newRoastBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  newRoastText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardIconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  roastText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 24,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  fixNumber: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    width: 18,
    marginTop: 1,
  },
  improvedText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
    fontStyle: "italic",
  },
});
