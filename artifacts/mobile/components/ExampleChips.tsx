import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export interface ExampleChip {
  label: string;
  category: string;
  content: string;
}

export const EXAMPLE_CHIPS: ExampleChip[] = [
  {
    label: "Roast my startup idea",
    category: "Startup Idea",
    content:
      "I'm building an app called VibeCheck that uses AI to analyze your energy levels throughout the day and suggests the best times to send important emails, make calls, or post on social media for maximum impact and engagement.",
  },
  {
    label: "Destroy my Instagram bio",
    category: "Instagram Bio",
    content:
      "✨ CEO & Founder | Digital Nomad | Helping brands tell their story 🚀 | Speaker | Consultant | dog mom 🐾 | Living my best life | DM for collabs",
  },
  {
    label: "Fix my dating profile",
    category: "Dating Profile",
    content:
      "Hey! I'm a laid-back guy who loves adventures and trying new things. I work hard but play harder. I enjoy hiking, traveling, good food, and making memories. Looking for someone who can keep up with my energy and loves to laugh.",
  },
  {
    label: "Judge my app idea",
    category: "Mobile App Idea",
    content:
      "An app called SocialDetox that tracks how much time you spend on social media and gives you achievement badges for using your phone less. It sends motivational notifications to remind you to be present in the real world.",
  },
  {
    label: "Rewrite my resume",
    category: "Resume Summary",
    content:
      "Dynamic and results-driven professional with 5+ years of experience in fast-paced environments. Proven track record of success in leveraging synergies and driving strategic initiatives that deliver value-add solutions. Passionate about making a difference.",
  },
];

interface Props {
  onSelect: (category: string, content: string) => void;
}

export function ExampleChips({ onSelect }: Props) {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handlePress = (chip: ExampleChip, index: number) => {
    setActiveIndex(index);
    onSelect(chip.category, chip.content);
    setTimeout(() => setActiveIndex(null), 600);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        TRY AN EXAMPLE
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {EXAMPLE_CHIPS.map((chip, i) => {
          const isActive = activeIndex === i;
          return (
            <TouchableOpacity
              key={chip.label}
              style={[
                styles.chip,
                {
                  borderColor: isActive ? colors.primary : colors.border,
                  backgroundColor: isActive
                    ? colors.primary + "18"
                    : colors.card,
                },
              ]}
              onPress={() => handlePress(chip, i)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? colors.primary : colors.mutedForeground },
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    paddingHorizontal: 2,
  },
  row: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
