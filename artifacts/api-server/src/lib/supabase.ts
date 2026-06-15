import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

export const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

let _client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  _client = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  logger.warn(
    "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — auth and credits are disabled"
  );
}

export const supabaseAdmin = _client;
