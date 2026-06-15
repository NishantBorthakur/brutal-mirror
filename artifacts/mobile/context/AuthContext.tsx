import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";

WebBrowser.maybeCompleteAuthSession();

const AUTH_TOKEN_KEY = "auth_session_token";
const ISSUER_URL = "https://replit.com/oidc";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  credits: number;
  authLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateCreditsBalance: (n: number) => void;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  credits: 0,
  authLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  updateCreditsBalance: () => {},
  getToken: async () => null,
});

function getApiBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

function getClientId(): string {
  return process.env.EXPO_PUBLIC_REPL_ID ?? "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [credits, setCredits] = useState(0);
  const [authLoading, setAuthLoading] = useState(true);

  const discovery = AuthSession.useAutoDiscovery(ISSUER_URL);
  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: getClientId(),
      scopes: ["openid", "email", "profile", "offline_access"],
      redirectUri,
      prompt: AuthSession.Prompt.Login,
    },
    discovery,
  );

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  }, []);

  const fetchCredits = useCallback(async (token: string) => {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { credits: number };
        setCredits(data.credits);
      }
    } catch {}
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (!token) {
        setUser(null);
        setCredits(0);
        setAuthLoading(false);
        return;
      }

      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { user: AuthUser | null };

      if (data.user) {
        setUser(data.user);
        void fetchCredits(token);
      } else {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        setUser(null);
        setCredits(0);
      }
    } catch {
      setUser(null);
      setCredits(0);
    } finally {
      setAuthLoading(false);
    }
  }, [fetchCredits]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (response?.type !== "success" || !request?.codeVerifier) return;

    const { code, state } = response.params;

    void (async () => {
      try {
        const apiBase = getApiBaseUrl();
        if (!apiBase) return;

        const exchangeRes = await fetch(`${apiBase}/api/mobile-auth/token-exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            code_verifier: request.codeVerifier,
            redirect_uri: redirectUri,
            state,
            nonce: (request as { nonce?: string }).nonce,
          }),
        });

        if (!exchangeRes.ok) return;

        const data = (await exchangeRes.json()) as { token?: string };
        if (data.token) {
          await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
          setAuthLoading(true);
          await fetchUser();
        }
      } catch {}
    })();
  }, [response, request, redirectUri, fetchUser]);

  const login = useCallback(async () => {
    try {
      await promptAsync();
    } catch {}
  }, [promptAsync]);

  const logout = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        const apiBase = getApiBaseUrl();
        await fetch(`${apiBase}/api/mobile-auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
    } finally {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      setUser(null);
      setCredits(0);
    }
  }, []);

  const updateCreditsBalance = useCallback((n: number) => {
    setCredits(n);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        credits,
        authLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateCreditsBalance,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
