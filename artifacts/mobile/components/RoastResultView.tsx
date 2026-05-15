import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { type RoastResult } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";
import { ScoreReport } from "./ScoreReport";
import { ViralCard } from "./ViralCard";

// ─── Shared card ────────────────────────────────────────────────────────────

interface ResultCardProps {
  icon?: string;
  emoji?: string;
  accentColor: string;
  title: string;
  delay?: number;
  children: React.ReactNode;
}

function ResultCard({
  icon,
  emoji,
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 360, delay, useNativeDriver: true }),
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
          <View style={[styles.cardIconBg, { backgroundColor: accentColor + "18" }]}>
            {emoji ? (
              <Text style={styles.cardEmoji}>{emoji}</Text>
            ) : icon ? (
              <Feather name={icon as any} size={14} color={accentColor} />
            ) : null}
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

// ─── Tab bar ─────────────────────────────────────────────────────────────────

const TABS = ["Report", "Roast", "Fixes", "Rewrite", "Share"] as const;
type Tab = (typeof TABS)[number];

function TabBar({
  active,
  onSelect,
}: {
  active: Tab;
  onSelect: (t: Tab) => void;
}) {
  const colors = useColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabBar}
    >
      {TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabPill,
              {
                backgroundColor: isActive ? colors.primary + "20" : "transparent",
                borderColor: isActive ? colors.primary + "60" : colors.border,
              },
            ]}
            onPress={() => onSelect(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? colors.primary : colors.mutedForeground },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Refinement row ───────────────────────────────────────────────────────────

const REFINEMENTS = [
  { mode: "sharper" as const, label: "Sharper", icon: "⚡" },
  { mode: "funnier" as const, label: "Funnier", icon: "😂" },
  { mode: "professional" as const, label: "Professional", icon: "💼" },
];

function RefinementRow({
  onRefine,
  isLoading,
}: {
  onRefine: (mode: "sharper" | "funnier" | "professional") => void;
  isLoading?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.refinementContainer}>
      <Text style={[styles.refinementLabel, { color: colors.mutedForeground }]}>
        REFINE
      </Text>
      <View style={styles.refinementRow}>
        {REFINEMENTS.map((r) => (
          <TouchableOpacity
            key={r.mode}
            style={[
              styles.refinementBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
                opacity: isLoading ? 0.5 : 1,
              },
            ]}
            onPress={() => onRefine(r.mode)}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.refinementIcon}>{r.icon}</Text>
            <Text style={[styles.refinementText, { color: colors.foreground }]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Tab content sections ────────────────────────────────────────────────────

function ReportTab({
  result,
  meta,
}: {
  result: RoastResult;
  meta?: Props["meta"];
}) {
  const colors = useColors();
  return (
    <View style={styles.tabContent}>
      {result.scoreReport ? (
        <ScoreReport scores={result.scoreReport} delay={60} />
      ) : (
        <View
          style={[
            styles.missingCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.missingText, { color: colors.mutedForeground }]}>
            Score data not available for this roast.
          </Text>
        </View>
      )}
      {result.viralOneLiner && (
        <ViralCard
          quote={result.viralOneLiner}
          category={meta?.category}
          intensity={meta?.intensity}
          delay={100}
        />
      )}
    </View>
  );
}

function RoastTab({ result }: { result: RoastResult }) {
  const colors = useColors();
  return (
    <View style={styles.tabContent}>
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
    </View>
  );
}

function FixesTab({ result }: { result: RoastResult }) {
  const colors = useColors();
  return (
    <View style={styles.tabContent}>
      <ResultCard
        icon="alert-triangle"
        accentColor="#ef4444"
        title="BIGGEST WEAKNESSES"
        delay={60}
      >
        {result.biggestWeaknesses.map((w, i) => (
          <View key={i} style={styles.listItem}>
            <View style={[styles.listDot, { backgroundColor: "#ef4444" }]} />
            <Text style={[styles.bodyText, { color: colors.foreground, flex: 1 }]}>
              {w}
            </Text>
          </View>
        ))}
      </ResultCard>
      <ResultCard
        icon="tool"
        accentColor="#22c55e"
        title="3 FIXES"
        delay={120}
      >
        {result.threeFixes.map((f, i) => (
          <View key={i} style={styles.listItem}>
            <View
              style={[styles.fixNumberBadge, { backgroundColor: "#22c55e18" }]}
            >
              <Text style={[styles.fixNumber, { color: "#22c55e" }]}>{i + 1}</Text>
            </View>
            <Text style={[styles.bodyText, { color: colors.foreground, flex: 1 }]}>
              {f}
            </Text>
          </View>
        ))}
      </ResultCard>
    </View>
  );
}

function RewriteTab({
  result,
  meta,
}: {
  result: RoastResult;
  meta?: Props["meta"];
}) {
  const colors = useColors();
  const originalPrompt = meta?.originalPrompt;
  return (
    <View style={styles.tabContent}>
      {originalPrompt && (
        <ResultCard
          icon="file-text"
          accentColor="#6b7280"
          title="BEFORE — ORIGINAL"
          delay={60}
        >
          <View
            style={[
              styles.beforeBox,
              {
                backgroundColor: "#6b728010",
                borderColor: "#6b728025",
              },
            ]}
          >
            <Text style={[styles.promptText, { color: colors.mutedForeground }]}>
              {originalPrompt}
            </Text>
          </View>
        </ResultCard>
      )}
      <ResultCard
        icon="star"
        accentColor="#8b5cf6"
        title="AFTER — IMPROVED VERSION"
        delay={120}
      >
        <View
          style={[
            styles.improvedBox,
            {
              backgroundColor: "#8b5cf608",
              borderColor: "#8b5cf625",
            },
          ]}
        >
          <Text style={[styles.improvedText, { color: colors.foreground }]}>
            {result.improvedVersion}
          </Text>
        </View>
      </ResultCard>
    </View>
  );
}

function ShareTab({
  result,
  meta,
  onCopyAll,
  copied,
}: {
  result: RoastResult;
  meta?: Props["meta"];
  onCopyAll: () => void;
  copied: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.tabContent}>
      {result.viralOneLiner ? (
        <ViralCard
          quote={result.viralOneLiner}
          category={meta?.category}
          intensity={meta?.intensity}
          delay={60}
        />
      ) : (
        <View
          style={[
            styles.missingCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.missingText, { color: colors.mutedForeground }]}>
            No viral one-liner for this roast.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.copyAllBtn,
          {
            backgroundColor: copied ? "#22c55e18" : colors.primary + "15",
            borderColor: copied ? "#22c55e40" : colors.primary + "40",
          },
        ]}
        onPress={onCopyAll}
        activeOpacity={0.8}
      >
        <Feather
          name={copied ? "check" : "copy"}
          size={16}
          color={copied ? "#22c55e" : colors.primary}
        />
        <Text
          style={[
            styles.copyAllText,
            { color: copied ? "#22c55e" : colors.primary },
          ]}
        >
          {copied ? "Copied to clipboard!" : "Copy Full Roast"}
        </Text>
      </TouchableOpacity>

      <View style={[styles.shareHint, { borderColor: colors.border }]}>
        <Text style={[styles.shareHintText, { color: colors.mutedForeground }]}>
          Screenshot the quote card above — it's made to share. 📲
        </Text>
      </View>
    </View>
  );
}

// ─── New Roast button ────────────────────────────────────────────────────────

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
          ? { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }
          : { backgroundColor: "transparent", borderColor: colors.border },
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

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  result: RoastResult;
  meta?: {
    category: string;
    intensity: string;
    personality?: string;
    originalPrompt?: string;
  } | null;
  onNewRoast?: () => void;
  onRefine?: (mode: "sharper" | "funnier" | "professional") => void;
  isLoading?: boolean;
}

const INTENSITY_COLORS: Record<string, string> = {
  Honest: "#6b7280",
  Harsh: "#f59e0b",
  Brutal: "#ef4444",
  "Career-ending": "#8b5cf6",
};

export function RoastResultView({
  result,
  meta,
  onNewRoast,
  onRefine,
  isLoading,
}: Props) {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<Tab>("Report");
  const [copied, setCopied] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const switchTab = (tab: Tab) => {
    Animated.timing(contentFade, {
      toValue: 0,
      duration: 80,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleCopyAll = async () => {
    const lines: string[] = [];
    if (result.viralOneLiner) {
      lines.push(`"${result.viralOneLiner}"`, `— Brutal Mirror`, ``);
    }
    lines.push(
      `BRUTAL MIRROR ROAST`,
      meta ? `${meta.category} · ${meta.intensity}${meta.personality ? ` · ${meta.personality}` : ""}` : "",
      ``,
      `THE ROAST`,
      result.brutalRoast,
      ``,
      `DIAGNOSIS`,
      result.actualDiagnosis,
      ``,
      `WEAKNESSES`,
      ...result.biggestWeaknesses.map((w, i) => `${i + 1}. ${w}`),
      ``,
      `3 FIXES`,
      ...result.threeFixes.map((f, i) => `${i + 1}. ${f}`),
      ``,
      `IMPROVED VERSION`,
      result.improvedVersion
    );
    await Clipboard.setStringAsync(lines.join("\n").trim());
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const intensityColor = meta
    ? (INTENSITY_COLORS[meta.intensity] ?? colors.primary)
    : colors.primary;

  const reportId = useRef(Date.now().toString(16).slice(-5).toUpperCase()).current;
  const reportTimestamp = useRef(
    new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* ── Report ID header ── */}
      <Animated.View style={{ opacity: headerFade }}>
        <View style={[styles.reportIdRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reportIdLeft}>
            <View style={[styles.reportDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.reportIdLabel, { color: colors.mutedForeground }]}>
              ROAST REPORT
            </Text>
            <Text style={[styles.reportId, { color: colors.primary }]}>#{reportId}</Text>
          </View>
          <Text style={[styles.reportTimestamp, { color: colors.mutedForeground }]}>
            {reportTimestamp}
          </Text>
        </View>
      </Animated.View>

      {/* ── Header ── */}
      <Animated.View style={{ opacity: headerFade }}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {meta && (
              <View style={styles.metaRow}>
                <View style={[styles.metaBadge, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[styles.metaText, { color: colors.primary }]}>
                    {meta.category}
                  </Text>
                </View>
                <View style={[styles.metaBadge, { backgroundColor: intensityColor + "18" }]}>
                  <Text style={[styles.metaText, { color: intensityColor }]}>
                    {meta.intensity}
                  </Text>
                </View>
                {meta.personality && (
                  <View style={[styles.metaBadge, { backgroundColor: "#6b728018" }]}>
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {meta.personality}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.copyBtn,
              {
                backgroundColor: copied ? "#22c55e18" : colors.card,
                borderColor: copied ? "#22c55e40" : colors.border,
              },
            ]}
            onPress={handleCopyAll}
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
              {copied ? "Copied!" : "Copy All"}
            </Text>
          </TouchableOpacity>
        </View>

        <NewRoastButton onPress={onNewRoast} variant="outline" />

        {onRefine && (
          <RefinementRow onRefine={onRefine} isLoading={isLoading} />
        )}
      </Animated.View>

      {/* ── Refinement loading banner ── */}
      {isLoading && (
        <View
          style={[
            styles.loadingBanner,
            {
              backgroundColor: colors.primary + "12",
              borderColor: colors.primary + "30",
            },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingBannerText, { color: colors.primary }]}>
            Generating refined roast…
          </Text>
        </View>
      )}

      {/* ── Tab bar ── */}
      <TabBar active={activeTab} onSelect={switchTab} />

      {/* ── Tab content ── */}
      <Animated.View style={{ opacity: contentFade }}>
        {activeTab === "Report" && (
          <ReportTab result={result} meta={meta} />
        )}
        {activeTab === "Roast" && <RoastTab result={result} />}
        {activeTab === "Fixes" && <FixesTab result={result} />}
        {activeTab === "Rewrite" && (
          <RewriteTab result={result} meta={meta} />
        )}
        {activeTab === "Share" && (
          <ShareTab
            result={result}
            meta={meta}
            onCopyAll={handleCopyAll}
            copied={copied}
          />
        )}
      </Animated.View>

      {/* ── Bottom new roast ── */}
      <NewRoastButton onPress={onNewRoast} variant="filled" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  reportIdRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  reportIdLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  reportDot: { width: 6, height: 6, borderRadius: 3 },
  reportIdLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  reportId: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  reportTimestamp: { fontSize: 11, fontFamily: "Inter_400Regular" },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  headerLeft: { flex: 1, minWidth: 0 },
  resultLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  metaRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  metaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  metaText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
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
  copyBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
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
  newRoastButtonText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  refinementContainer: { gap: 8, marginTop: 8 },
  refinementLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  refinementRow: { flexDirection: "row", gap: 8 },
  refinementBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  refinementIcon: { fontSize: 14 },
  refinementText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tabBar: { gap: 8, paddingVertical: 4 },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabContent: { gap: 12 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
  },
  cardAccentBar: { width: 3 },
  cardInner: { flex: 1, padding: 16, paddingLeft: 14, gap: 12, minWidth: 0 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIconBg: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardEmoji: { fontSize: 14 },
  cardTitle: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    flexShrink: 1,
  },
  cardContent: { gap: 10 },
  roastText: { fontSize: 15, fontFamily: "Inter_500Medium", lineHeight: 26 },
  bodyText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  promptText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    fontStyle: "italic",
  },
  improvedText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 23,
    fontStyle: "italic",
  },
  listItem: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
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
  fixNumber: { fontSize: 12, fontFamily: "Inter_700Bold" },
  beforeBox: { borderRadius: 10, borderWidth: 1, padding: 14 },
  improvedBox: { borderRadius: 10, borderWidth: 1, padding: 14 },
  missingCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  missingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  copyAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 56,
  },
  copyAllText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  shareHint: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  shareHintText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  loadingBannerText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
