import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/context/AuthContext";

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

export interface AppSettings {
  defaultCategory: string;
  defaultIntensity: string;
  defaultPersonality: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultCategory: "Startup Idea",
  defaultIntensity: "Brutal",
  defaultPersonality: "Savage Mentor",
};

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
  settings: AppSettings;
  settingsLoaded: boolean;
  generateRoast: (
    category: string,
    intensity: string,
    content: string,
    personality: string,
    refinementMode?: string
  ) => Promise<void>;
  clearHistory: () => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearResult: () => void;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
}

const RoastContext = createContext<RoastContextValue | null>(null);

const HISTORY_KEY = "brutal_mirror_history";
const SETTINGS_KEY = "brutal_mirror_settings";
const MAX_HISTORY = 20;

export function RoastProvider({ children }: { children: React.ReactNode }) {
  const { getToken, updateCreditsBalance } = useAuth();

  const [history, setHistory] = useState<RoastHistoryItem[]>([]);
  const [currentResult, setCurrentResult] = useState<RoastResult | null>(null);
  const [currentMeta, setCurrentMeta] = useState<RoastMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const historyRef = useRef<RoastHistoryItem[]>([]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(HISTORY_KEY),
      AsyncStorage.getItem(SETTINGS_KEY),
    ]).then(([rawHistory, rawSettings]) => {
      if (rawHistory) {
        try {
          const parsed = JSON.parse(rawHistory) as RoastHistoryItem[];
          setHistory(parsed);
          historyRef.current = parsed;
        } catch {}
      }
      if (rawSettings) {
        try {
          const parsed = JSON.parse(rawSettings) as Partial<AppSettings>;
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch {}
      }
      setSettingsLoaded(true);
    }).catch(() => setSettingsLoaded(true));
  }, []);

  const saveHistory = useCallback(async (items: RoastHistoryItem[]) => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
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
      if (!refinementMode) {
        setCurrentResult(null);
      }

      try {
        const domain = process.env.EXPO_PUBLIC_DOMAIN;
        const baseUrl = domain ? `https://${domain}` : "";

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const token = await getToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${baseUrl}/api/roast`, {
          method: "POST",
          headers,
          body: JSON.stringify({ category, intensity, content, personality, refinementMode }),
        });

        const data = (await response.json()) as
          | (RoastResult & { creditsRemaining?: number })
          | { error: string; message?: string };

        if (!response.ok) {
          const errData = data as { error: string; message?: string };
          if (errData.error === "AUTH_REQUIRED") {
            throw new Error("AUTH_REQUIRED");
          }
          if (errData.error === "OUT_OF_CREDITS") {
            throw new Error("OUT_OF_CREDITS");
          }
          throw new Error(
            errData.message ?? errData.error ?? "The roast engine failed. Try again."
          );
        }

        const resultData = data as RoastResult & { creditsRemaining?: number };
        const result: RoastResult = {
          viralOneLiner: resultData.viralOneLiner,
          brutalRoast: resultData.brutalRoast,
          actualDiagnosis: resultData.actualDiagnosis,
          biggestWeaknesses: resultData.biggestWeaknesses,
          threeFixes: resultData.threeFixes,
          improvedVersion: resultData.improvedVersion,
          scoreReport: resultData.scoreReport,
        };

        if (!result.brutalRoast || !result.actualDiagnosis) {
          throw new Error("The AI returned a messy response. Try again.");
        }

        if (resultData.creditsRemaining !== undefined) {
          updateCreditsBalance(resultData.creditsRemaining);
        }

        setCurrentResult(result);
        setCurrentMeta({ category, intensity, content, personality });

        if (refinementMode) {
          if (historyRef.current.length > 0) {
            const updated = [
              { ...historyRef.current[0]!, result },
              ...historyRef.current.slice(1),
            ];
            historyRef.current = updated;
            setHistory(updated);
            await saveHistory(updated);
          }
        } else {
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
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Something went wrong. Try again.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [getToken, saveHistory, updateCreditsBalance]
  );

  const clearHistory = useCallback(async () => {
    historyRef.current = [];
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  }, []);

  const deleteHistoryItem = useCallback(async (id: string) => {
    const next = historyRef.current.filter((item) => item.id !== id);
    historyRef.current = next;
    setHistory(next);
    await saveHistory(next);
  }, [saveHistory]);

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
        settings,
        settingsLoaded,
        generateRoast,
        clearHistory,
        deleteHistoryItem,
        clearResult,
        updateSettings,
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
