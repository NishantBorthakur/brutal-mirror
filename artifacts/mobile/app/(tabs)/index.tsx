import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
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
  const { currentResult, currentMeta, clearResult, history } = useRoast();

  const scrollRef = useRef<ScrollView>(null);
  const resultYRef = useRef<number>(0);
  const formRef = useRef<RoastFormHandle>(null);

  const scrollToResult = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: resultYRef.current - 16,
        animated: true,
      });
    }, 120);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleNewRoast = () => {
    formRef.current?.reset(); // clear textarea + validation
    clearResult();            // clear the result state
    scrollToTop();            // scroll back to the form
  };

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
              <Text
                style={[styles.appTagline, { color: colors.mutedForeground }]}
              >
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
            <View
              style={[
                styles.historyBadge,
                { backgroundColor: colors.primary },
              ]}
            >
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
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Hero — only shown when no result */}
        {!currentResult && (
          <View style={styles.hero}>
            <LinearGradient
              colors={["#7c3aed18", "#8b5cf60a", "transparent"]}
              style={styles.heroBg}
            />
            <Text style={[styles.heroHeadline, { color: colors.foreground }]}>
              Get roasted by AI.{"\n"}
              <Text style={{ color: colors.primary }}>Then get better.</Text>
            </Text>
            <Text
              style={[
                styles.heroSubheadline,
                { color: colors.mutedForeground },
              ]}
            >
              Paste your idea, bio, resume, profile, or plan.{"\n"}Brutal
              Mirror will destroy it — and rebuild it sharper.
            </Text>
          </View>
        )}

        {/* Form */}
        <RoastForm ref={formRef} onResultReady={scrollToResult} />

        {/* Result section — extra top spacing via marginTop */}
        {currentResult && (
          <View
            style={styles.resultSection}
            onLayout={(e) => {
              resultYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.resultDivider}>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: colors.border },
                ]}
              />
              <View
                style={[
                  styles.dividerBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Feather name="zap" size={11} color="#fff" />
                <Text style={styles.dividerText}>RESULT</Text>
              </View>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: colors.border },
                ]}
              />
            </View>

            <RoastResultView
              result={currentResult}
              meta={
                currentMeta
                  ? {
                      category: currentMeta.category,
                      intensity: currentMeta.intensity,
                      originalPrompt: currentMeta.content,
                    }
                  : null
              }
              onNewRoast={handleNewRoast}
            />
          </View>
        )}
      </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flex: 1,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  appName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  appTagline: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
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
  historyBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    padding: 24,
    paddingTop: 28,
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  heroHeadline: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    textAlign: "left",
    lineHeight: 38,
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  heroSubheadline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "left",
    lineHeight: 22,
  },
  resultSection: {
    gap: 16,
    // Extra vertical breathing room above the result divider
    marginTop: 12,
    paddingTop: 8,
  },
  resultDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dividerText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
});
