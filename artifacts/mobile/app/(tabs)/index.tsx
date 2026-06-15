import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

import { AuthModal } from "@/components/AuthModal";
import { BillingModal } from "@/components/BillingModal";
import { ONBOARDING_KEY, OnboardingCard } from "@/components/OnboardingCard";
import { OutOfCreditsModal } from "@/components/OutOfCreditsModal";
import { type RoastFormHandle, RoastForm } from "@/components/RoastForm";
import { RoastResultView } from "@/components/RoastResultView";
import { useAuth } from "@/context/AuthContext";
import { useRoast } from "@/context/RoastContext";
import { useColors } from "@/hooks/useColors";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const APP_ICON = require("@/assets/images/icon.png") as number;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentResult, currentMeta, clearResult, generateRoast, isLoading, error } = useRoast();
  const { isAuthenticated, credits, authLoading } = useAuth();

  const scrollRef = useRef<ScrollView>(null);
  const resultYRef = useRef<number>(0);
  const formRef = useRef<RoastFormHandle>(null);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((val) => { if (!val) setShowOnboarding(true); })
      .catch(() => {});
  }, []);

  // React to special error codes from the backend
  useEffect(() => {
    if (error === "AUTH_REQUIRED") setShowAuthModal(true);
    else if (error === "OUT_OF_CREDITS") setShowOutOfCreditsModal(true);
  }, [error]);

  const scrollToResult = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: resultYRef.current - 16, animated: true });
    }, 120);
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <OutOfCreditsModal visible={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />
      <BillingModal visible={showBillingModal} onClose={() => setShowBillingModal(false)} />

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
        <View style={styles.logoRow}>
          <Image source={APP_ICON} style={styles.logoImage} />
          <View>
            <Text style={[styles.appName, { color: colors.foreground }]}>
              Brutal Mirror
            </Text>
            <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
              Brutal feedback. Better results.
            </Text>
          </View>
        </View>

        {/* Credits badge / Sign in button */}
        {!authLoading && (
          isAuthenticated ? (
            <View style={[styles.creditBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
              <Feather name="zap" size={11} color={colors.primary} />
              <Text style={[styles.creditText, { color: colors.primary }]}>
                {credits}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.signInBtn, { borderColor: colors.border }]}
              onPress={() => setShowAuthModal(true)}
              activeOpacity={0.75}
            >
              <Text style={[styles.signInText, { color: colors.foreground }]}>Sign In</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* ── Low-credit banner ── */}
      {!authLoading && isAuthenticated && credits <= 2 && (
        <TouchableOpacity
          style={[styles.lowCreditBanner, { backgroundColor: credits === 0 ? "#ef444410" : "#f59e0b10", borderColor: credits === 0 ? "#ef444425" : "#f59e0b25" }]}
          onPress={() => credits === 0 ? setShowOutOfCreditsModal(true) : setShowBillingModal(true)}
          activeOpacity={0.8}
        >
          <Feather name="alert-circle" size={12} color={credits === 0 ? "#ef4444" : "#f59e0b"} />
          <Text style={[styles.lowCreditText, { color: credits === 0 ? "#ef4444" : "#f59e0b" }]}>
            {credits === 0
              ? "Out of credits — "
              : `${credits} credit${credits === 1 ? "" : "s"} left — `}
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>
              {credits === 0 ? "Top up now" : "Buy more"}
            </Text>
          </Text>
          <Feather name="chevron-right" size={12} color={credits === 0 ? "#ef4444" : "#f59e0b"} />
        </TouchableOpacity>
      )}

      {/* ── Scroll body ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Onboarding card — first visit only */}
        {showOnboarding && (
          <OnboardingCard onDismiss={() => setShowOnboarding(false)} />
        )}

        {/* Hero — only shown when no result */}
        {!currentResult && !showOnboarding && (
          <View style={styles.hero}>
            <LinearGradient
              colors={["#7c3aed22", "#8b5cf610", "transparent"]}
              style={styles.heroBg}
            />
            <View style={styles.heroGlow} />
            <Text style={[styles.heroHeadline, { color: colors.foreground }]}>
              Your idea is not special.{"\n"}
              <Text style={{ color: colors.primary }}>Let's fix that.</Text>
            </Text>
            <Text style={[styles.heroSubheadline, { color: colors.mutedForeground }]}>
              Paste your bio, startup idea, profile, resume, or app concept.
              Brutal Mirror will roast it, diagnose it, and rebuild it sharper.
            </Text>
            {!isAuthenticated && (
              <TouchableOpacity
                style={[styles.heroSignInPrompt, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "28" }]}
                onPress={() => setShowAuthModal(true)}
                activeOpacity={0.8}
              >
                <Feather name="zap" size={13} color={colors.primary} />
                <Text style={[styles.heroSignInText, { color: colors.primary }]}>
                  Sign in for 5 free roast credits
                </Text>
                <Feather name="arrow-right" size={13} color={colors.primary} />
              </TouchableOpacity>
            )}
            <View style={[styles.microCopyRow, { borderColor: colors.border }]}>
              <Feather name="zap" size={12} color={colors.mutedForeground} />
              <Text style={[styles.microCopy, { color: colors.mutedForeground }]}>
                No fluff. No fake positivity. Just sharp feedback.
              </Text>
            </View>
          </View>
        )}

        {/* Form */}
        <RoastForm
          ref={formRef}
          onResultReady={scrollToResult}
          onNeedAuth={() => setShowAuthModal(true)}
          onNoCredits={() => setShowOutOfCreditsModal(true)}
        />

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
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  logoImage: { width: 36, height: 36, borderRadius: 10 },
  appName: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  appTagline: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  creditBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  creditText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  signInBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  signInText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  lowCreditBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lowCreditText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
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
  heroSignInPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  heroSignInText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  microCopyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 2,
  },
  microCopy: { fontSize: 12, fontFamily: "Inter_500Medium" },
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
  dividerText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
});
