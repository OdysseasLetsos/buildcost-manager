import type { Database } from "@/src/integrations/supabase/types";

export type DashboardProject = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  | "id"
  | "code"
  | "name"
  | "client_name"
  | "location"
  | "status"
  | "budget_amount"
>;

export type DashboardEmployee = Pick<
  Database["public"]["Tables"]["employees"]["Row"],
  "id" | "full_name" | "employee_type" | "daily_rate" | "hourly_rate" | "active"
>;

export type DashboardMonthlyPeriod = Pick<
  Database["public"]["Tables"]["monthly_periods"]["Row"],
  "id" | "month_key" | "status" | "created_at" | "locked_at"
>;

export type DashboardProjectStats = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  archivedProjects: number;
  latestActiveProjects: DashboardProject[];
};

export type DashboardEmployeeStats = {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  byType: {
    permanent: number;
    daily_worker: number;
    subcontractor: number;
  };
};

export type DashboardMonthlyPeriodStats = {
  latestOpenMonth: DashboardMonthlyPeriod | null;
  selectedMonth: DashboardMonthlyPeriod | null;
  openMonths: number;
  lockedMonths: number;
  latestMonthlyPeriods: DashboardMonthlyPeriod[];
};

export type DashboardDailyWorkProjectTotals = {
  projectId: string;
  totalEntries: number;
  totalHours: number;
  totalOvertimeHours: number;
  totalExpenseAmount: number;
  estimatedLaborCost: number;
};

export type DashboardRecentDailyWorkEntry = {
  id: string;
  workDate: string;
  employeeName: string;
  projectCode: string;
  projectName: string;
  hours: number;
  overtimeHours: number;
  expenseAmount: number;
};

export type DashboardMonthlyWorkTotal = {
  monthKey: string;
  totalEntries: number;
  totalHours: number;
  totalOvertimeHours: number;
  totalExpenseAmount: number;
  estimatedLaborCost: number;
};

export type DashboardDailyWorkStats = {
  selectedMonth: DashboardMonthlyPeriod | null;
  totalEntries: number;
  totalHours: number;
  totalOvertimeHours: number;
  totalExpenseAmount: number;
  estimatedLaborCost: number;
  projectTotals: DashboardDailyWorkProjectTotals[];
  recentEntries: DashboardRecentDailyWorkEntry[];
  monthlyTotals: DashboardMonthlyWorkTotal[];
};

export type DashboardSummaryMetric = {
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "emerald" | "amber" | "slate";
};
