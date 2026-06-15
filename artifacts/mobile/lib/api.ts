// Single source of truth for the API base URL and OIDC client ID.
//
// Resolution order:
//   1. EXPO_PUBLIC_DOMAIN env var — set by EAS Build (eas.json → env) and by
//      the Replit dev-server launch script (EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN).
//   2. .env.production file — read by Expo CLI for local `expo prebuild` / Gradle builds.
//   3. __DEV__ guard — in release builds where the env var still isn't present,
//      fall through to the hardcoded production URL so the APK never points at localhost.
//
// EXPO_PUBLIC_REPL_ID is the OIDC client_id for Replit Auth.
// It equals the REPL_ID of this project and is NOT a secret (it appears
// in OAuth redirect URLs).

const PRODUCTION_API_URL = "https://brutal-ai-web.replit.app";
const PRODUCTION_REPL_ID = "64102179-4bb8-45c2-8b7e-8105ac5279ef";

export function getApiBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  // __DEV__ is false in every release bundle (APK / AAB).
  // This ensures the app never calls localhost in production.
  if (!__DEV__) return PRODUCTION_API_URL;
  return "";
}

export function getClientId(): string {
  return process.env.EXPO_PUBLIC_REPL_ID ?? PRODUCTION_REPL_ID;
}
