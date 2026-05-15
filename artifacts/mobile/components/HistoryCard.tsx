import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { type RoastHistoryItem } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  item: RoastHistoryItem;
  onPress: () => void;
  onDelete?: () => void;
  onCopyQuote?: () => void;
}

const INTENSITY_CONFIG: Record<string, { color: string; emoji: string }> = {
  Honest: { color: "#6b7280", emoji: "🙂" },
  Harsh: { color: "#f59e0b", emoji: "😬" },
  Brutal: { color: "#ef4444", emoji: "💀" },
  "Career-ending": { color: "#8b5cf6", emoji: "☠️" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function HistoryCard({ item, onPress, onDelete, onCopyQuote }: Props) {
  const colors = useColors();
  const intensityConfig =
    INTENSITY_CONFIG[item.intensity] ?? { color: colors.mutedForeground, emoji: "🔥" };

  const previewText = item.result.viralOneLiner
    ? `"${item.result.viralOneLiner}"`
    : `"${item.result.brutalRoast}"`;

  const hasActions = onDelete || onCopyQuote;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.accentBar, { backgroundColor: intensityConfig.color }]} />
      <View style={styles.inner}>
        {/* Badges + date */}
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{item.category}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: intensityConfig.color + "15" }]}>
              <Text style={styles.intensityEmoji}>{intensityConfig.emoji}</Text>
              <Text style={[styles.badgeText, { color: intensityConfig.color }]}>
                {item.intensity}
              </Text>
            </View>
            {item.personality && (
              <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                  {item.personality}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        {/* Prompt preview */}
        <Text style={[styles.promptPreview, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.contentPreview}
        </Text>

        {/* One-liner / roast preview */}
        <Text style={[styles.roastPreview, { color: colors.foreground }]} numberOfLines={2}>
          {previewText}
        </Text>

        {/* Score pill if available */}
        {item.result.scoreReport && (
          <View style={styles.scorePill}>
            <View style={[styles.scoreCircle, { backgroundColor: "#8b5cf620", borderColor: "#8b5cf630" }]}>
              <Text style={styles.scoreNumber}>{item.result.scoreReport.overallRoastScore}</Text>
            </View>
            <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Roast Score</Text>
          </View>
        )}

        {/* Action row */}
        {hasActions ? (
          <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.openBtn} onPress={onPress} activeOpacity={0.7}>
              <Text style={[styles.openText, { color: colors.primary }]}>Open full roast</Text>
              <Feather name="chevron-right" size={13} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.actionRight}>
              {onCopyQuote && item.result.viralOneLiner && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.muted }]}
                  onPress={onCopyQuote}
                  activeOpacity={0.7}
                >
                  <Feather name="copy" size={13} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.destructive + "15" }]}
                  onPress={onDelete}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={13} color={colors.destructive} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.footer}>
            <Text style={[styles.openText, { color: colors.primary }]}>View full roast</Text>
            <Feather name="chevron-right" size={13} color={colors.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
  },
  accentBar: { width: 3 },
  inner: { flex: 1, padding: 14, gap: 9 },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  badgeRow: { flexDirection: "row", gap: 5, flexShrink: 1, flexWrap: "wrap" },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 4 },
  intensityEmoji: { fontSize: 11 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  date: { fontSize: 11, fontFamily: "Inter_400Regular", flexShrink: 0 },
  promptPreview: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  roastPreview: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
    fontStyle: "italic",
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scoreCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNumber: {
    color: "#8b5cf6",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  scoreLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 2,
    gap: 8,
  },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  openText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  actionRight: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { flexDirection: "row", alignItems: "center", gap: 4 },
});
