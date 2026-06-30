import { createClient } from "@/src/integrations/supabase/server";
import type { EmployeeBenefit, EmployeeBenefitWithRelations } from "../types";

export async function getEmployeeBenefits(
  companyId: string,
): Promise<EmployeeBenefitWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_benefits")
    .select("*")
    .eq("company_id", companyId)
    .order("benefit_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[payments:getEmployeeBenefits] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load employee benefits.");
  }

  const benefits = (data ?? []) as EmployeeBenefit[];
  const employeeIds = [...new Set(benefits.map((benefit) => benefit.employee_id))];
  const employeesResult = employeeIds.length
    ? await supabase.from("employees").select("id, full_name").in("id", employeeIds)
    : { data: [], error: null };

  if (employeesResult.error) {
    console.error("[payments:getEmployeeBenefits:employees] Supabase error", {
      message: employeesResult.error.message,
      code: employeesResult.error.code,
      details: employeesResult.error.details,
      hint: employeesResult.error.hint,
    });
    throw new Error("Unable to load benefit employees.");
  }

  const employeeMap = new Map(
    (employeesResult.data ?? []).map((employee) => [employee.id, employee.full_name]),
  );

  return benefits.map((benefit) => ({
    ...benefit,
    employeeName: employeeMap.get(benefit.employee_id) ?? "-",
  }));
}
