type SupabaseEnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY";

type SupabaseConfig = {
  url: string;
  anonKey: string;
};

function readRequiredEnv(key: SupabaseEnvKey): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required Supabase environment variable: ${key}`);
  }

  return value;
}

export function getSupabaseConfig(): SupabaseConfig {
  return {
    url: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
