import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RoastForm } from "@/components/RoastForm";
import { RoastResultView } from "@/components/RoastResultView";
import { useRoast } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentResult, currentMeta, clearResult, history } = useRoast();
  const scrollRef = useRef<ScrollView>(null);
  const resultYRef = useRef<number>(0);

  const scrollToResult = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: resultYRef.current - 16,
        animated: true,
      });
    }, 120);
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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
        <View style={styles.headerLeft}>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={["#7c3aed", "#a78bfa"]}
              style={styles.logoGradient}
            >
              <Text style={styles.logoEmoji}>🪞</Text>
            </LinearGradient>
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
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
          onPress={() => router.push("/history")}
          activeOpacity={0.7}
        >
          <Feather name="clock" size={17} color={colors.mutedForeground} />
          {history.length > 0 && (
            <View
              style={[styles.historyBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.historyBadgeText}>
                {history.length > 9 ? "9+" : history.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
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
              Paste your idea, bio, resume, profile, or plan.{"\n"}Brutal Mirror
              will destroy it — and rebuild it sharper.
            </Text>
          </View>
        )}

        <View style={styles.formSection}>
          <RoastForm onResultReady={scrollToResult} />
        </View>

        {currentResult && (
          <View
            style={styles.resultSection}
            onLayout={(e) => {
              resultYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.resultDivider}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
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
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
            </View>
            <RoastResultView
              result={currentResult}
              meta={currentMeta}
              onNewRoast={clearResult}
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
  logoGradient: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: {
    fontSize: 18,
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
  },
  hero: {
    marginBottom: 28,
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
  formSection: {},
  resultSection: {
    gap: 16,
    marginTop: 8,
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
