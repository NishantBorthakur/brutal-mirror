import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { LoadingDots } from "./LoadingDots";

const MESSAGES = [
  "Judging the damage…",
  "Searching for originality…",
  "Measuring cringe levels…",
  "Calling the council of brutal honesty…",
  "Diagnosing the core issues…",
  "Rebuilding something usable…",
  "Detecting generic thinking…",
  "Finding what you already knew but ignored…",
  "Preparing the verdict…",
  "Assembling the brutal truth…",
];

export function LoadingMessages() {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 230, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]).start();
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <LoadingDots color="#fff" size={7} spacing={5} />
      <Animated.Text style={[styles.message, { opacity: fadeAnim }]}>
        {MESSAGES[index]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 10 },
  message: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.1,
    flexShrink: 1,
  },
});
