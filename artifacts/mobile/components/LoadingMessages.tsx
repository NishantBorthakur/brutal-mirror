import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { LoadingDots } from "./LoadingDots";

const MESSAGES = [
  "Analyzing your bad decisions…",
  "Finding the personality flaws…",
  "Generating emotional damage…",
  "Searching for originality…",
  "Consulting the council of judgment…",
  "Measuring the gap between vision and reality…",
  "Diagnosing the core issues…",
  "Preparing the brutal truth…",
  "Detecting generic thinking…",
  "Assembling the verdict…",
];

export function LoadingMessages() {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
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
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  message: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.1,
  },
});
