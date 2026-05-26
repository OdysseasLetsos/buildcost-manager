import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/integrations/supabase/types";

export function normalizeEmail(email: FormDataEntryValue | null): string {
  return String(email ?? "").trim().toLowerCase();
}

export function readSafeNextPath(nextPath: string | null | undefined): string {
  const value = String(nextPath ?? "").trim();

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function getPostAuthRedirectPath(
  supabase: SupabaseClient<Database>,
  requestedNextPath: string,
): Promise<string> {
  const nextPath = readSafeNextPath(requestedNextPath);

  if (
    nextPath === "/accept-invite" ||
    nextPath.startsWith("/accept-invite?")
  ) {
    return nextPath;
  }

  const { data, error } = await supabase
    .from("company_members")
    .select("id")
    .eq("status", "active")
    .limit(1);

  if (error) {
    console.error("[auth:post-auth-redirect] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  return data && data.length > 0 ? nextPath : "/onboarding/company";
}
