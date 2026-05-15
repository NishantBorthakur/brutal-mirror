import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HistoryCard } from "@/components/HistoryCard";
import { RoastResultView } from "@/components/RoastResultView";
import { useToast } from "@/components/Toast";
import { type RoastHistoryItem, useRoast } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

export default function VaultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history, clearHistory, deleteHistoryItem } = useRoast();
  const { showToast } = useToast();
  const [selectedItem, setSelectedItem] = useState<RoastHistoryItem | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const categories = useMemo(() => {
    const cats = new Set(history.map((h) => h.category));
    return ["All", ...Array.from(cats)];
  }, [history]);

  const filtered = useMemo(() => {
    return history.filter((item) => {
      const matchCat = activeCategory === "All" || item.category === activeCategory;
      if (!matchCat) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.contentPreview.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.result.viralOneLiner ?? "").toLowerCase().includes(q) ||
        (item.personality ?? "").toLowerCase().includes(q)
      );
    });
  }, [history, search, activeCategory]);

  const handleClearAll = () => {
    Alert.alert(
      "Clear Roast Vault",
      "This will permanently delete all saved roasts. No going back.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await clearHistory();
            setSelectedItem(null);
            showToast("Roast Vault cleared", "info");
          },
        },
      ]
    );
  };

  const handleDelete = (item: RoastHistoryItem) => {
    Alert.alert("Delete Roast", "Remove this roast from your vault?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteHistoryItem(item.id);
          if (selectedItem?.id === item.id) setSelectedItem(null);
          showToast("Roast deleted", "info");
        },
      },
    ]);
  };

  const handleCopyQuote = async (item: RoastHistoryItem) => {
    const text = item.result.viralOneLiner
      ? `"${item.result.viralOneLiner}" — Brutal Mirror`
      : `"${item.result.brutalRoast.slice(0, 140)}…" — Brutal Mirror`;
    await Clipboard.setStringAsync(text);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast("Quote copied!", "success");
  };

  // ── Detail view ──
  if (selectedItem) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingTop: topPad + 14, borderBottomColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => setSelectedItem(null)}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={17} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Past Roast</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {selectedItem.category} · {selectedItem.intensity}
              {selectedItem.personality ? ` · ${selectedItem.personality}` : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: colors.destructive + "50", backgroundColor: colors.destructive + "10" }]}
            onPress={() => handleDelete(selectedItem)}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={15} color={colors.destructive} />
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={[styles.detailContent, { paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <RoastResultView
            result={selectedItem.result}
            meta={{
              category: selectedItem.category,
              intensity: selectedItem.intensity,
              personality: selectedItem.personality,
              originalPrompt: selectedItem.originalPrompt ?? selectedItem.contentPreview,
            }}
          />
        </ScrollView>
      </View>
    );
  }

  // ── List view ──
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 14, borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Roast Vault</Text>
          {history.length > 0 && (
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {history.length} roast{history.length !== 1 ? "s" : ""} saved
            </Text>
          )}
        </View>
        {history.length > 0 && (
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: colors.destructive + "40", backgroundColor: colors.destructive + "10" }]}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={15} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient colors={["#8b5cf620", "#8b5cf608"]} style={styles.emptyIconBg}>
            <Image source={require("@/assets/images/icon.png")} style={styles.emptyIcon} resizeMode="contain" />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No emotional damage archived yet.
          </Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            Save a roast and it will appear here. Generate your first one from the Roast tab.
          </Text>
        </View>
      ) : (
        <>
          {/* Search */}
          <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={15} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search your vault…"
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
                selectionColor={colors.primary}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category filter */}
          {categories.length > 2 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive ? colors.primary + "18" : colors.card,
                        borderColor: isActive ? colors.primary + "60" : colors.border,
                      },
                    ]}
                    onPress={() => setActiveCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterLabel, { color: isActive ? colors.primary : colors.mutedForeground }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {filtered.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>
                No roasts match your search.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.list, { paddingBottom: 32 }]}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <HistoryCard
                  item={item}
                  onPress={() => setSelectedItem(item)}
                  onDelete={() => handleDelete(item)}
                  onCopyQuote={() => handleCopyQuote(item)}
                />
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  detailContent: { padding: 20 },
  searchRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 20, paddingTop: 8 },
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
  emptyIcon: { width: 48, height: 48 },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 28,
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  noResults: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  noResultsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
