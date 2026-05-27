import { createClient } from "@/src/integrations/supabase/server";
import type {
  DashboardDailyWorkProjectTotals,
  DashboardDailyWorkStats,
  DashboardEmployee,
  DashboardMonthlyPeriod,
  DashboardMonthlyWorkTotal,
  DashboardProject,
  DashboardRecentDailyWorkEntry,
} from "../types";

type DailyWorkRow = {
  id: string;
  month_id: string;
  employee_id: string;
  project_id: string;
  work_date: string;
  hours: number | string | null;
  overtime_hours: number | string | null;
  expense_amount: number | string | null;
  created_at: string;
};

type SupabaseErrorShape = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

function logSupabaseError(source: string, error: SupabaseErrorShape) {
  console.error(`[dashboard:${source}] Supabase error`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

function toNumber(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

function getEstimatedLaborCost(
  entry: DailyWorkRow,
  employee: DashboardEmployee | undefined,
): number {
  const hourlyRate =
    employee?.hourly_rate !== null && employee?.hourly_rate !== undefined
      ? toNumber(employee.hourly_rate)
      : employee?.daily_rate !== null && employee?.daily_rate !== undefined
        ? toNumber(employee.daily_rate) / 8
        : 0;

  // TODO: Refine overtime multipliers and payroll rules in the Payments/IKA modules.
  return (toNumber(entry.hours) + toNumber(entry.overtime_hours)) * hourlyRate;
}

function emptyStats(selectedMonth: DashboardMonthlyPeriod | null): DashboardDailyWorkStats {
  return {
    selectedMonth,
    totalEntries: 0,
    totalHours: 0,
    totalOvertimeHours: 0,
    totalExpenseAmount: 0,
    estimatedLaborCost: 0,
    projectTotals: [],
    recentEntries: [],
    monthlyTotals: [],
  };
}

export async function getDashboardDailyWork(
  companyId: string,
  selectedMonth: DashboardMonthlyPeriod | null,
): Promise<DashboardDailyWorkStats> {
  const supabase = await createClient();

  const [entriesResult, employeesResult, projectsResult, periodsResult] =
    await Promise.all([
      supabase
        .from("daily_work_entries")
        .select(
          "id, month_id, employee_id, project_id, work_date, hours, overtime_hours, expense_amount, created_at",
        )
        .eq("company_id", companyId)
        .order("work_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("employees")
        .select("id, full_name, employee_type, daily_rate, hourly_rate, active")
        .eq("company_id", companyId),
      supabase
        .from("projects")
        .select("id, code, name, client_name, location, status, budget_amount")
        .eq("company_id", companyId),
      supabase
        .from("monthly_periods")
        .select("id, month_key, status, created_at, locked_at")
        .eq("company_id", companyId)
        .order("month_key", { ascending: false }),
    ]);

  if (entriesResult.error) {
    logSupabaseError("getDashboardDailyWork:entries", entriesResult.error);
    throw new Error("Unable to load dashboard daily work entries.");
  }

  if (employeesResult.error) {
    logSupabaseError("getDashboardDailyWork:employees", employeesResult.error);
    throw new Error("Unable to load dashboard employee rates.");
  }

  if (projectsResult.error) {
    logSupabaseError("getDashboardDailyWork:projects", projectsResult.error);
    throw new Error("Unable to load dashboard project totals.");
  }

  if (periodsResult.error) {
    logSupabaseError("getDashboardDailyWork:periods", periodsResult.error);
    throw new Error("Unable to load dashboard monthly work totals.");
  }

  const entries = (entriesResult.data ?? []) as DailyWorkRow[];
  const employees = (employeesResult.data ?? []) as DashboardEmployee[];
  const projects = (projectsResult.data ?? []) as DashboardProject[];
  const periods = (periodsResult.data ?? []) as DashboardMonthlyPeriod[];

  if (entries.length === 0) {
    return emptyStats(selectedMonth);
  }

  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const periodById = new Map(periods.map((period) => [period.id, period]));
  const selectedEntries = selectedMonth
    ? entries.filter((entry) => entry.month_id === selectedMonth.id)
    : entries;

  const projectTotalsById = new Map<string, DashboardDailyWorkProjectTotals>();
  let totalHours = 0;
  let totalOvertimeHours = 0;
  let totalExpenseAmount = 0;
  let estimatedLaborCost = 0;

  for (const entry of selectedEntries) {
    const hours = toNumber(entry.hours);
    const overtimeHours = toNumber(entry.overtime_hours);
    const expenseAmount = toNumber(entry.expense_amount);
    const laborCost = getEstimatedLaborCost(entry, employeeById.get(entry.employee_id));
    const existing = projectTotalsById.get(entry.project_id) ?? {
      projectId: entry.project_id,
      totalEntries: 0,
      totalHours: 0,
      totalOvertimeHours: 0,
      totalExpenseAmount: 0,
      estimatedLaborCost: 0,
    };

    existing.totalEntries += 1;
    existing.totalHours += hours;
    existing.totalOvertimeHours += overtimeHours;
    existing.totalExpenseAmount += expenseAmount;
    existing.estimatedLaborCost += laborCost;
    projectTotalsById.set(entry.project_id, existing);

    totalHours += hours;
    totalOvertimeHours += overtimeHours;
    totalExpenseAmount += expenseAmount;
    estimatedLaborCost += laborCost;
  }

  const recentEntries: DashboardRecentDailyWorkEntry[] = selectedEntries
    .slice(0, 6)
    .map((entry) => {
      const employee = employeeById.get(entry.employee_id);
      const project = projectById.get(entry.project_id);

      return {
        id: entry.id,
        workDate: entry.work_date,
        employeeName: employee?.full_name ?? "-",
        projectCode: project?.code ?? "-",
        projectName: project?.name ?? "-",
        hours: toNumber(entry.hours),
        overtimeHours: toNumber(entry.overtime_hours),
        expenseAmount: toNumber(entry.expense_amount),
      };
    });

  const monthlyTotalsByKey = new Map<string, DashboardMonthlyWorkTotal>();

  for (const entry of entries) {
    const period = periodById.get(entry.month_id);
    const monthKey = period?.month_key ?? entry.work_date.slice(0, 7);
    const existing = monthlyTotalsByKey.get(monthKey) ?? {
      monthKey,
      totalEntries: 0,
      totalHours: 0,
      totalOvertimeHours: 0,
      totalExpenseAmount: 0,
      estimatedLaborCost: 0,
    };

    existing.totalEntries += 1;
    existing.totalHours += toNumber(entry.hours);
    existing.totalOvertimeHours += toNumber(entry.overtime_hours);
    existing.totalExpenseAmount += toNumber(entry.expense_amount);
    existing.estimatedLaborCost += getEstimatedLaborCost(
      entry,
      employeeById.get(entry.employee_id),
    );
    monthlyTotalsByKey.set(monthKey, existing);
  }

  return {
    selectedMonth,
    totalEntries: selectedEntries.length,
    totalHours,
    totalOvertimeHours,
    totalExpenseAmount,
    estimatedLaborCost,
    projectTotals: Array.from(projectTotalsById.values()),
    recentEntries,
    monthlyTotals: Array.from(monthlyTotalsByKey.values())
      .sort((first, second) => first.monthKey.localeCompare(second.monthKey))
      .slice(-8),
  };
}
