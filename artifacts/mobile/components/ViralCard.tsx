import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  quote: string;
  category?: string;
  intensity?: string;
  delay?: number;
}

export function ViralCard({ quote, category, intensity, delay = 0 }: Props) {
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        speed: 14,
        bounciness: 4,
      }),
    ]).start();
  }, []);

  const handleCopyQuote = async () => {
    await Clipboard.setStringAsync(`"${quote}" — Brutal Mirror`);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <LinearGradient
        colors={["#1a0533", "#2d0a5e", "#1a0533"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Glow effect layer */}
        <View style={styles.glowLayer} />

        {/* Top branding row */}
        <View style={styles.brandRow}>
          <View style={styles.brandLeft}>
            <View style={styles.brandDot} />
            <Text style={styles.brandLabel}>BRUTAL MIRROR</Text>
          </View>
          {category && intensity && (
            <Text style={styles.brandMeta}>
              {category} · {intensity}
            </Text>
          )}
        </View>

        {/* The one-liner */}
        <View style={styles.quoteBlock}>
          <Text style={styles.quoteMarks}>"</Text>
          <Text style={styles.quoteText}>{quote}</Text>
          <Text style={[styles.quoteMarks, styles.quoteMarksClose]}>"</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTagline}>brutalmirror.app</Text>
          <TouchableOpacity
            style={[
              styles.copyQuoteBtn,
              copied && styles.copyQuoteBtnSuccess,
            ]}
            onPress={handleCopyQuote}
            activeOpacity={0.8}
          >
            <Feather
              name={copied ? "check" : "copy"}
              size={13}
              color={copied ? "#22c55e" : "#a78bfa"}
            />
            <Text
              style={[
                styles.copyQuoteText,
                copied && { color: "#22c55e" },
              ]}
            >
              {copied ? "Copied!" : "Copy Quote"}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  gradient: {
    padding: 24,
    paddingTop: 22,
    gap: 18,
    borderWidth: 1,
    borderColor: "#7c3aed40",
    borderRadius: 20,
  },
  glowLayer: {
    position: "absolute",
    top: "30%",
    left: "20%",
    right: "20%",
    height: 80,
    backgroundColor: "#8b5cf6",
    opacity: 0.12,
    borderRadius: 40,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#8b5cf6",
  },
  brandLabel: {
    color: "#a78bfa",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  brandMeta: {
    color: "#8b7cf8",
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  quoteBlock: {
    gap: 4,
  },
  quoteMarks: {
    color: "#6d28d9",
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    lineHeight: 28,
    height: 24,
  },
  quoteMarksClose: {
    textAlign: "right",
    marginTop: 4,
  },
  quoteText: {
    color: "#f3e8ff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    lineHeight: 28,
    letterSpacing: -0.3,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  footerTagline: {
    color: "#7c6aed",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  copyQuoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#7c3aed50",
    backgroundColor: "#7c3aed18",
  },
  copyQuoteBtnSuccess: {
    borderColor: "#22c55e40",
    backgroundColor: "#22c55e10",
  },
  copyQuoteText: {
    color: "#a78bfa",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
