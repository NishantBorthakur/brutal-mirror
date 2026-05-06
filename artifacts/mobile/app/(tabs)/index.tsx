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
  const { currentResult, currentMeta, clearResult } = useRoast();
  const scrollRef = useRef<ScrollView>(null);

  const scrollToResult = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad =
    Platform.OS === "web" ? 34 : insets.bottom;

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
        <View>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            Brutal Mirror
          </Text>
          <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
            Get roasted. Then get better.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.historyBtn, { borderColor: colors.border }]}
          onPress={() => router.push("/history")}
        >
          <Feather name="clock" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!currentResult && (
          <View style={styles.hero}>
            <LinearGradient
              colors={["#8b5cf620", "#8b5cf605"]}
              style={styles.heroGradient}
            >
              <View
                style={[
                  styles.heroIconRing,
                  { borderColor: colors.primary + "40" },
                ]}
              >
                <Text style={styles.heroEmoji}>🪞</Text>
              </View>
            </LinearGradient>
            <Text style={[styles.heroHeadline, { color: colors.foreground }]}>
              Get roasted by AI.{"\n"}Then get better.
            </Text>
            <Text
              style={[styles.heroSubheadline, { color: colors.mutedForeground }]}
            >
              Paste your idea, bio, resume, profile, or plan. Brutal Mirror will
              destroy it, diagnose it, and rebuild it sharper.
            </Text>
          </View>
        )}

        <View style={styles.formSection}>
          <RoastForm onResultReady={scrollToResult} />
        </View>

        {currentResult && (
          <View style={styles.resultSection}>
            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />
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
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  hero: {
    alignItems: "center",
    marginBottom: 28,
  },
  heroGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: {
    fontSize: 32,
  },
  heroHeadline: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  heroSubheadline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  formSection: {
    gap: 12,
  },
  resultSection: {
    gap: 16,
    marginTop: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
});
