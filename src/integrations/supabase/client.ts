import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";
import type { Database } from "./types";

export function createClient(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseConfig();

  return createBrowserClient<Database>(url, anonKey);
}
