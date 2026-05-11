import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { type RoastHistoryItem } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  item: RoastHistoryItem;
  onPress: () => void;
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

export function HistoryCard({ item, onPress }: Props) {
  const colors = useColors();
  const intensityConfig =
    INTENSITY_CONFIG[item.intensity] ?? { color: colors.mutedForeground, emoji: "🔥" };

  const previewText = item.result.viralOneLiner
    ? `"${item.result.viralOneLiner}"`
    : `"${item.result.brutalRoast}"`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={[styles.accentBar, { backgroundColor: intensityConfig.color }]} />
      <View style={styles.inner}>
        {/* Top row: badges + date */}
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{item.category}</Text>
            </View>
            <View style={[styles.intensityBadge, { backgroundColor: intensityConfig.color + "15" }]}>
              <Text style={styles.intensityEmoji}>{intensityConfig.emoji}</Text>
              <Text style={[styles.badgeText, { color: intensityConfig.color }]}>
                {item.intensity}
              </Text>
            </View>
            {item.personality && (
              <View style={[styles.personalityBadge, { backgroundColor: colors.secondary }]}>
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

        {/* Original prompt preview */}
        <Text
          style={[styles.contentPreview, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {item.contentPreview}
        </Text>

        {/* Roast/one-liner preview */}
        <Text
          style={[styles.roastPreview, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {previewText}
        </Text>

        <View style={styles.footer}>
          <Text style={[styles.viewText, { color: colors.primary }]}>View full roast</Text>
          <Feather name="chevron-right" size={13} color={colors.primary} />
        </View>
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
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  intensityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  personalityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  intensityEmoji: { fontSize: 11 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  date: { fontSize: 11, fontFamily: "Inter_400Regular", flexShrink: 0 },
  contentPreview: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  roastPreview: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
    fontStyle: "italic",
  },
  footer: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  viewText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
