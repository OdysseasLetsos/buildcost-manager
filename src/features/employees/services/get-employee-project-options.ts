import { createClient } from "@/src/integrations/supabase/server";
import type { EmployeeProjectOption } from "../types";

export async function getEmployeeProjectOptions(
  companyId: string,
): Promise<EmployeeProjectOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, code, name")
    .eq("company_id", companyId)
    .neq("status", "archived")
    .order("code", { ascending: true });

  if (error) {
    console.error("[employees:getEmployeeProjectOptions] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load project options.");
  }

  return (data ?? []) as EmployeeProjectOption[];
}
