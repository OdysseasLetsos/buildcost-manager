import { createClient } from "@/src/integrations/supabase/server";
import type { Revenue } from "../types";

export async function getRevenueById(
  companyId: string,
  revenueId: string,
): Promise<Revenue | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("revenues")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", revenueId)
    .maybeSingle();

  if (error) {
    console.error("[revenues:getRevenueById] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load revenue.");
  }

  return (data as Revenue | null) ?? null;
}
