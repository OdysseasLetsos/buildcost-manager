import { createClient } from "@/src/integrations/supabase/server";
import type {
  DailyWorkEntry,
  DailyWorkEntryWithRelations,
  DailyWorkFilters,
} from "../types";

export async function getDailyWorkEntries(
  companyId: string,
  filters: DailyWorkFilters = {},
): Promise<DailyWorkEntryWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("daily_work_entries")
    .select("*")
    .eq("company_id", companyId)
    .order("work_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.monthId) {
    query = query.eq("month_id", filters.monthId);
  }

  if (filters.workDate) {
    query = query.eq("work_date", filters.workDate);
  }

  if (filters.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }

  if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[daily-work:getDailyWorkEntries] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load daily work entries.");
  }

  const entries = (data ?? []) as DailyWorkEntry[];
  const employeeIds = [...new Set(entries.map((entry) => entry.employee_id))];
  const projectIds = [...new Set(entries.map((entry) => entry.project_id))];
  const monthIds = [...new Set(entries.map((entry) => entry.month_id))];

  const [employeesResult, projectsResult, monthsResult] = await Promise.all([
    employeeIds.length
      ? supabase.from("employees").select("id, full_name").in("id", employeeIds)
      : Promise.resolve({ data: [], error: null }),
    projectIds.length
      ? supabase.from("projects").select("id, code, name").in("id", projectIds)
      : Promise.resolve({ data: [], error: null }),
    monthIds.length
      ? supabase.from("monthly_periods").select("id, month_key").in("id", monthIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (employeesResult.error || projectsResult.error || monthsResult.error) {
    console.error("[daily-work:getDailyWorkEntries:relations] Supabase error", {
      employeeError: employeesResult.error?.message,
      projectError: projectsResult.error?.message,
      monthError: monthsResult.error?.message,
    });

    throw new Error("Unable to load daily work relations.");
  }

  const employeeMap = new Map(
    (employeesResult.data ?? []).map((employee) => [employee.id, employee.full_name]),
  );
  const projectMap = new Map(
    (projectsResult.data ?? []).map((project) => [project.id, project]),
  );
  const monthMap = new Map(
    (monthsResult.data ?? []).map((month) => [month.id, month.month_key]),
  );

  return entries.map((entry) => {
    const project = projectMap.get(entry.project_id);

    return {
      ...entry,
      employeeName: employeeMap.get(entry.employee_id) ?? "-",
      projectName: project?.name ?? "-",
      projectCode: project?.code ?? "-",
      monthKey: monthMap.get(entry.month_id) ?? "-",
    };
  });
}
