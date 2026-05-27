import { createClient } from "@/src/integrations/supabase/server";
import type { Employee } from "../types";

export async function getEmployeeById(
  companyId: string,
  employeeId: string,
): Promise<Employee | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", employeeId)
    .maybeSingle();

  if (error) {
    console.error("[employees:getEmployeeById] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load employee.");
  }

  return data as Employee | null;
}
