import { createClient } from "@/src/integrations/supabase/server";
import type { DashboardEmployee, DashboardEmployeeStats } from "../types";

export async function getDashboardEmployees(
  companyId: string,
): Promise<DashboardEmployeeStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_type, active")
    .eq("company_id", companyId);

  if (error) {
    console.error("[dashboard:getDashboardEmployees] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load dashboard employees.");
  }

  const employees = (data ?? []) as DashboardEmployee[];

  return {
    totalEmployees: employees.length,
    activeEmployees: employees.filter((employee) => employee.active).length,
    inactiveEmployees: employees.filter((employee) => !employee.active).length,
    byType: {
      permanent: employees.filter((employee) => employee.employee_type === "permanent")
        .length,
      daily_worker: employees.filter(
        (employee) => employee.employee_type === "daily_worker",
      ).length,
      subcontractor: employees.filter(
        (employee) => employee.employee_type === "subcontractor",
      ).length,
    },
  };
}
