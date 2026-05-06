import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface RoastResult {
  brutalRoast: string;
  actualDiagnosis: string;
  biggestWeaknesses: string[];
  threeFixes: string[];
  improvedVersion: string;
}

export interface RoastHistoryItem {
  id: string;
  category: string;
  intensity: string;
  contentPreview: string;
  result: RoastResult;
  createdAt: string;
}

interface RoastContextValue {
  history: RoastHistoryItem[];
  currentResult: RoastResult | null;
  currentMeta: { category: string; intensity: string; content: string } | null;
  isLoading: boolean;
  error: string | null;
  generateRoast: (
    category: string,
    intensity: string,
    content: string
  ) => Promise<void>;
  clearHistory: () => void;
  clearResult: () => void;
  loadHistoryItem: (item: RoastHistoryItem) => void;
}

const RoastContext = createContext<RoastContextValue | null>(null);

const HISTORY_KEY = "brutal_mirror_history";
const MAX_HISTORY = 20;

export function RoastProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<RoastHistoryItem[]>([]);
  const [currentResult, setCurrentResult] = useState<RoastResult | null>(null);
  const [currentMeta, setCurrentMeta] = useState<{
    category: string;
    intensity: string;
    content: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY)
      .then((raw) => {
        if (raw) setHistory(JSON.parse(raw) as RoastHistoryItem[]);
      })
      .catch(() => {});
  }, []);

  const saveHistory = useCallback(async (items: RoastHistoryItem[]) => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  const generateRoast = useCallback(
    async (category: string, intensity: string, content: string) => {
      setIsLoading(true);
      setError(null);
      setCurrentResult(null);

      try {
        const domain = process.env.EXPO_PUBLIC_DOMAIN;
        const baseUrl = domain ? `https://${domain}` : "";

        const response = await fetch(`${baseUrl}/api/roast`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, intensity, content }),
        });

        const data = (await response.json()) as
          | RoastResult
          | { error: string };

        if (!response.ok) {
          const errData = data as { error: string };
          throw new Error(errData.error || "Failed to generate roast");
        }

        const result = data as RoastResult;
        setCurrentResult(result);
        setCurrentMeta({ category, intensity, content });

        const newItem: RoastHistoryItem = {
          id:
            Date.now().toString() + Math.random().toString(36).substr(2, 9),
          category,
          intensity,
          contentPreview: content.slice(0, 80) + (content.length > 80 ? "…" : ""),
          result,
          createdAt: new Date().toISOString(),
        };

        const newHistory = [newItem, ...history].slice(0, MAX_HISTORY);
        setHistory(newHistory);
        await saveHistory(newHistory);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [history, saveHistory]
  );

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  }, []);

  const clearResult = useCallback(() => {
    setCurrentResult(null);
    setCurrentMeta(null);
    setError(null);
  }, []);

  const loadHistoryItem = useCallback((item: RoastHistoryItem) => {
    setCurrentResult(item.result);
    setCurrentMeta({
      category: item.category,
      intensity: item.intensity,
      content: item.contentPreview,
    });
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
        loadHistoryItem,
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
