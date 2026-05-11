import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useRef } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type RoastFormHandle, RoastForm } from "@/components/RoastForm";
import { RoastResultView } from "@/components/RoastResultView";
import { useRoast } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const APP_ICON = require("@/assets/images/icon.png") as number;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentResult, currentMeta, clearResult, history, generateRoast, isLoading } =
    useRoast();

  const scrollRef = useRef<ScrollView>(null);
  const resultYRef = useRef<number>(0);
  const formRef = useRef<RoastFormHandle>(null);

  const scrollToResult = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: resultYRef.current - 16, animated: true });
    }, 120);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleNewRoast = () => {
    formRef.current?.reset();
    clearResult();
    scrollToTop();
  };

  const handleRefine = useCallback(
    (mode: "sharper" | "funnier" | "professional") => {
      if (!currentMeta) return;
      generateRoast(
        currentMeta.category,
        currentMeta.intensity,
        currentMeta.content,
        currentMeta.personality,
        mode
      );
      scrollToResult();
    },
    [currentMeta, generateRoast]
  );

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
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
        <View style={styles.headerLeft}>
          <View style={styles.logoRow}>
            <Image source={APP_ICON} style={styles.logoImage} />
            <View>
              <Text style={[styles.appName, { color: colors.foreground }]}>
                Brutal Mirror
              </Text>
              <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
                Get roasted. Then get better.
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.historyBtn,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
          onPress={() => router.push("/history")}
          activeOpacity={0.7}
        >
          <Feather name="clock" size={17} color={colors.mutedForeground} />
          {history.length > 0 && (
            <View style={[styles.historyBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.historyBadgeText}>
                {history.length > 9 ? "9+" : history.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Scroll body ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Hero — only shown when no result */}
        {!currentResult && (
          <View style={styles.hero}>
            <LinearGradient
              colors={["#7c3aed22", "#8b5cf610", "transparent"]}
              style={styles.heroBg}
            />
            {/* Subtle glow orb */}
            <View style={styles.heroGlow} />

            <Text style={[styles.heroHeadline, { color: colors.foreground }]}>
              Your idea is not special.{"\n"}
              <Text style={{ color: colors.primary }}>Let's fix that.</Text>
            </Text>
            <Text style={[styles.heroSubheadline, { color: colors.mutedForeground }]}>
              Paste your bio, startup idea, profile, resume, or app concept. Brutal Mirror will roast it, diagnose it, and rebuild it sharper.
            </Text>
            <View style={[styles.microCopyRow, { borderColor: colors.border }]}>
              <Feather name="zap" size={12} color={colors.mutedForeground} />
              <Text style={[styles.microCopy, { color: colors.mutedForeground }]}>
                No fluff. No fake positivity. Just sharp feedback.
              </Text>
            </View>
          </View>
        )}

        {/* Form */}
        <RoastForm ref={formRef} onResultReady={scrollToResult} />

        {/* Result section */}
        {currentResult && (
          <View
            style={styles.resultSection}
            onLayout={(e) => { resultYRef.current = e.nativeEvent.layout.y; }}
          >
            <View style={styles.resultDivider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <View style={[styles.dividerBadge, { backgroundColor: colors.primary }]}>
                <Feather name="zap" size={11} color="#fff" />
                <Text style={styles.dividerText}>RESULT</Text>
              </View>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <RoastResultView
              result={currentResult}
              meta={
                currentMeta
                  ? {
                      category: currentMeta.category,
                      intensity: currentMeta.intensity,
                      personality: currentMeta.personality,
                      originalPrompt: currentMeta.content,
                    }
                  : null
              }
              onNewRoast={handleNewRoast}
              onRefine={handleRefine}
              isLoading={isLoading}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flex: 1 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoImage: { width: 36, height: 36, borderRadius: 10 },
  appName: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  appTagline: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  historyBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  historyBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20, paddingTop: 24, gap: 20 },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    padding: 24,
    paddingTop: 30,
    gap: 14,
  },
  heroBg: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  heroGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#8b5cf6",
    opacity: 0.07,
  },
  heroHeadline: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  heroSubheadline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  microCopyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 2,
  },
  microCopy: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.1,
  },
  resultSection: { gap: 16, marginTop: 12, paddingTop: 8 },
  resultDivider: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dividerText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
});
