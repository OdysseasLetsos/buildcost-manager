import { createClient } from "@/src/integrations/supabase/server";
import type { EmployeeIka, EmployeeIkaFilters, EmployeeIkaWithRelations } from "../types";

export async function getEmployeeIka(
  companyId: string,
  filters: EmployeeIkaFilters = {},
): Promise<EmployeeIkaWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("employee_ika")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (filters.monthId) query = query.eq("month_id", filters.monthId);
  if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);

  const { data, error } = await query;

  if (error) {
    console.error("[ika:getEmployeeIka] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load employee IKA.");
  }

  const ikaRows = (data ?? []) as EmployeeIka[];
  const employeeIds = [...new Set(ikaRows.map((row) => row.employee_id))];
  const monthIds = [...new Set(ikaRows.map((row) => row.month_id))];

  const [employeesResult, monthsResult] = await Promise.all([
    employeeIds.length
      ? supabase.from("employees").select("id, full_name").in("id", employeeIds)
      : Promise.resolve({ data: [], error: null }),
    monthIds.length
      ? supabase.from("monthly_periods").select("id, month_key").in("id", monthIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (employeesResult.error || monthsResult.error) {
    console.error("[ika:getEmployeeIka:relations] Supabase error", {
      employeeError: employeesResult.error?.message,
      monthError: monthsResult.error?.message,
    });
    throw new Error("Unable to load IKA relations.");
  }

  const employeeMap = new Map(
    (employeesResult.data ?? []).map((employee) => [employee.id, employee.full_name]),
  );
  const monthMap = new Map(
    (monthsResult.data ?? []).map((month) => [month.id, month.month_key]),
  );

  return ikaRows.map((row) => ({
    ...row,
    employeeName: employeeMap.get(row.employee_id) ?? "-",
    monthKey: monthMap.get(row.month_id) ?? "-",
  }));
}
