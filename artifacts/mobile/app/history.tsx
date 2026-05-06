import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HistoryCard } from "@/components/HistoryCard";
import { RoastResultView } from "@/components/RoastResultView";
import { type RoastHistoryItem, useRoast } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { history, clearHistory, loadHistoryItem } = useRoast();
  const [selectedItem, setSelectedItem] =
    useState<RoastHistoryItem | null>(null);

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to delete all your roasts? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning
            );
            clearHistory();
            setSelectedItem(null);
          },
        },
      ]
    );
  };

  if (selectedItem) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: topPad + 16,
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => setSelectedItem(null)}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Past Roast
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <FlatList
          data={[selectedItem]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: bottomPad + 20 },
          ]}
          renderItem={({ item }) => (
            <RoastResultView
              result={item.result}
              meta={{ category: item.category, intensity: item.intensity }}
            />
          )}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 16,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          History
        </Text>
        {history.length > 0 ? (
          <TouchableOpacity
            style={[styles.clearBtn, { borderColor: colors.destructive + "60" }]}
            onPress={handleClearHistory}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIconBg,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="clock" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No roasts yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Your roasting history will appear here after your first session.
          </Text>
          <TouchableOpacity
            style={[
              styles.startBtn,
              { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" },
            ]}
            onPress={() => router.back()}
          >
            <Text style={[styles.startBtnText, { color: colors.primary }]}>
              Start Roasting
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomPad + 20 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <HistoryCard
              item={item}
              onPress={() => setSelectedItem(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: 20,
  },
  list: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  startBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  startBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
