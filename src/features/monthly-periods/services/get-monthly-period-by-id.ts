import { createClient } from "@/src/integrations/supabase/server";
import type { MonthlyPeriod } from "../types";

export async function getMonthlyPeriodById(
  companyId: string,
  monthId: string,
): Promise<MonthlyPeriod | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_periods")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", monthId)
    .maybeSingle();

  if (error) {
    console.error("[monthly-periods:getMonthlyPeriodById] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load monthly period.");
  }

  return data as MonthlyPeriod | null;
}
