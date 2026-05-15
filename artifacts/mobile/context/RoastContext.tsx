import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface ScoreReport {
  overallRoastScore: number;
  clarity: number;
  originality: number;
  marketability: number;
  cringeLevel: number;
  fixability: number;
}

export interface RoastResult {
  viralOneLiner?: string;
  brutalRoast: string;
  actualDiagnosis: string;
  biggestWeaknesses: string[];
  threeFixes: string[];
  improvedVersion: string;
  scoreReport?: ScoreReport;
}

export interface RoastHistoryItem {
  id: string;
  category: string;
  intensity: string;
  personality?: string;
  contentPreview: string;
  originalPrompt?: string;
  result: RoastResult;
  createdAt: string;
}

interface RoastMeta {
  category: string;
  intensity: string;
  content: string;
  personality: string;
}

interface RoastContextValue {
  history: RoastHistoryItem[];
  currentResult: RoastResult | null;
  currentMeta: RoastMeta | null;
  isLoading: boolean;
  error: string | null;
  generateRoast: (
    category: string,
    intensity: string,
    content: string,
    personality: string,
    refinementMode?: string
  ) => Promise<void>;
  clearHistory: () => Promise<void>;
  clearResult: () => void;
}

const RoastContext = createContext<RoastContextValue | null>(null);

const HISTORY_KEY = "brutal_mirror_history";
const MAX_HISTORY = 20;

export function RoastProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<RoastHistoryItem[]>([]);
  const [currentResult, setCurrentResult] = useState<RoastResult | null>(null);
  const [currentMeta, setCurrentMeta] = useState<RoastMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const historyRef = useRef<RoastHistoryItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as RoastHistoryItem[];
          setHistory(parsed);
          historyRef.current = parsed;
        }
      })
      .catch(() => {});
  }, []);

  const saveHistory = useCallback(async (items: RoastHistoryItem[]) => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  const generateRoast = useCallback(
    async (
      category: string,
      intensity: string,
      content: string,
      personality: string,
      refinementMode?: string
    ) => {
      setIsLoading(true);
      setError(null);
      // Only wipe the current result for fresh roasts, not refinements.
      // During refinement the result view stays visible while the new result loads.
      if (!refinementMode) {
        setCurrentResult(null);
      }

      try {
        const domain = process.env.EXPO_PUBLIC_DOMAIN;
        const baseUrl = domain ? `https://${domain}` : "";

        const response = await fetch(`${baseUrl}/api/roast`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, intensity, content, personality, refinementMode }),
        });

        const data = (await response.json()) as RoastResult | { error: string };

        if (!response.ok) {
          const errData = data as { error: string };
          throw new Error(errData.error || "Failed to generate roast");
        }

        const result = data as RoastResult;

        if (!result.brutalRoast || !result.actualDiagnosis) {
          throw new Error("AI returned an incomplete response. Try again.");
        }

        setCurrentResult(result);
        setCurrentMeta({ category, intensity, content, personality });

        const newItem: RoastHistoryItem = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          category,
          intensity,
          personality,
          contentPreview: content.slice(0, 80) + (content.length > 80 ? "…" : ""),
          originalPrompt: content,
          result,
          createdAt: new Date().toISOString(),
        };

        const newHistory = [newItem, ...historyRef.current].slice(0, MAX_HISTORY);
        historyRef.current = newHistory;
        setHistory(newHistory);
        await saveHistory(newHistory);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Something went wrong. Try again.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [saveHistory]
  );

  const clearHistory = useCallback(async () => {
    historyRef.current = [];
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  }, []);

  const clearResult = useCallback(() => {
    setCurrentResult(null);
    setCurrentMeta(null);
    setError(null);
  }, []);

  return (
    <RoastContext.Provider
      value={{
        history,
        currentResult,
        currentMeta,
        isLoading,
        error,
        generateRoast,
        clearHistory,
        clearResult,
      }}
    >
      {children}
    </RoastContext.Provider>
  );
}

export function useRoast(): RoastContextValue {
  const ctx = useContext(RoastContext);
  if (!ctx) throw new Error("useRoast must be used within RoastProvider");
  return ctx;
}
