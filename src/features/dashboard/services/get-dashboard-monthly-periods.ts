import { createClient } from "@/src/integrations/supabase/server";
import type {
  DashboardMonthlyPeriod,
  DashboardMonthlyPeriodStats,
} from "../types";

export async function getDashboardMonthlyPeriods(
  companyId: string,
): Promise<DashboardMonthlyPeriodStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_periods")
    .select("id, month_key, status, created_at, locked_at")
    .eq("company_id", companyId)
    .order("month_key", { ascending: false });

  if (error) {
    console.error("[dashboard:getDashboardMonthlyPeriods] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load dashboard monthly periods.");
  }

  const monthlyPeriods = (data ?? []) as DashboardMonthlyPeriod[];
  const openMonths = monthlyPeriods.filter((period) => period.status === "open");

  return {
    latestOpenMonth: openMonths[0] ?? null,
    selectedMonth: openMonths[0] ?? monthlyPeriods[0] ?? null,
    openMonths: openMonths.length,
    lockedMonths: monthlyPeriods.filter((period) => period.status === "locked").length,
    latestMonthlyPeriods: monthlyPeriods.slice(0, 5),
  };
}
