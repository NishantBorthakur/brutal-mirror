import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
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
  const { history, clearHistory } = useRoast();
  const [selectedItem, setSelectedItem] = useState<RoastHistoryItem | null>(
    null
  );

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleClearHistory = () => {
    Alert.alert(
      "Clear All History",
      "This will permanently delete all your saved roasts. No going back.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning
            );
            await clearHistory();
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
              paddingTop: topPad + 14,
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.backBtn,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
            onPress={() => setSelectedItem(null)}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={17} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Past Roast
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {selectedItem.category} · {selectedItem.intensity}
            </Text>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={[
            styles.scrollPad,
            { paddingBottom: bottomPad + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <RoastResultView
            result={selectedItem.result}
            meta={{
              category: selectedItem.category,
              intensity: selectedItem.intensity,
            }}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 14,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={17} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            History
          </Text>
          {history.length > 0 && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {history.length} roast{history.length !== 1 ? "s" : ""} saved
            </Text>
          )}
        </View>
        {history.length > 0 && (
          <TouchableOpacity
            style={[
              styles.clearBtn,
              {
                borderColor: colors.destructive + "50",
                backgroundColor: colors.destructive + "10",
              },
            ]}
            onPress={handleClearHistory}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={15} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={["#8b5cf620", "#8b5cf608"]}
            style={styles.emptyIconBg}
          >
            <Text style={styles.emptyEmoji}>🪞</Text>
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Nothing here yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Your roasting history will appear here. Every roast is saved for up
            to 20 sessions.
          </Text>
          <TouchableOpacity
            style={[styles.startBtn]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#6d28d9", "#8b5cf6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startBtnGradient}
            >
              <Feather name="zap" size={15} color="#fff" />
              <Text style={styles.startBtnText}>Start Roasting</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomPad + 24 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <HistoryCard item={item} onPress={() => setSelectedItem(item)} />
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
    paddingBottom: 14,
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
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollPad: {
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
    gap: 14,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  startBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  startBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
