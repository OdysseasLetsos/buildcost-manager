import { createClient } from "@/src/integrations/supabase/server";
import type { Employee, EmployeeFilters } from "../types";

export async function getEmployees(
  companyId: string,
  filters: EmployeeFilters = {},
): Promise<Employee[]> {
  const supabase = await createClient();
  let query = supabase
    .from("employees")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const search = filters.search?.trim();

  if (search) {
    const escapedSearch = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(`full_name.ilike.%${escapedSearch}%,notes.ilike.%${escapedSearch}%`);
  }

  if (filters.employeeType && filters.employeeType !== "all") {
    query = query.eq("employee_type", filters.employeeType);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("active", filters.status === "active");
  }

  const { data, error } = await query;

  if (error) {
    console.error("[employees:getEmployees] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load employees.");
  }

  return (data ?? []) as Employee[];
}
