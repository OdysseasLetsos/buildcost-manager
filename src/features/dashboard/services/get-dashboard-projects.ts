import { createClient } from "@/src/integrations/supabase/server";
import type { DashboardProject } from "../types";

export async function getDashboardProjects(
  companyId: string,
): Promise<DashboardProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, code, name, client_name, location, status, budget_amount")
    .eq("company_id", companyId)
    .in("status", ["active", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("[dashboard:getDashboardProjects] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load dashboard projects.");
  }

  return data ?? [];
}
