import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { type RoastHistoryItem } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  item: RoastHistoryItem;
  onPress: () => void;
}

const INTENSITY_COLORS: Record<string, string> = {
  Honest: "#6b7280",
  Harsh: "#f59e0b",
  Brutal: "#ef4444",
  "Career-ending": "#8b5cf6",
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
  const intensityColor =
    INTENSITY_COLORS[item.intensity] || colors.mutedForeground;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.topRow}>
        <View style={styles.badges}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {item.category}
            </Text>
          </View>
          <View
            style={[
              styles.intensityBadge,
              { backgroundColor: intensityColor + "15" },
            ]}
          >
            <Text style={[styles.intensityText, { color: intensityColor }]}>
              {item.intensity}
            </Text>
          </View>
        </View>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>

      <Text
        style={[styles.preview, { color: colors.mutedForeground }]}
        numberOfLines={2}
      >
        {item.contentPreview}
      </Text>

      <Text
        style={[styles.roastPreview, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {item.result.brutalRoast}
      </Text>

      <View style={styles.footer}>
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badges: {
    flexDirection: "row",
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  intensityText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  preview: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  roastPreview: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  footer: {
    alignItems: "flex-end",
  },
});
