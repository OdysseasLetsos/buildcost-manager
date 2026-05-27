import { createClient } from "@/src/integrations/supabase/server";
import type { MonthlyPeriod } from "../types";

export async function getMonthlyPeriods(companyId: string): Promise<MonthlyPeriod[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_periods")
    .select("*")
    .eq("company_id", companyId)
    .order("month_key", { ascending: false });

  if (error) {
    console.error("[monthly-periods:getMonthlyPeriods] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load monthly periods.");
  }

  return (data ?? []) as MonthlyPeriod[];
}
