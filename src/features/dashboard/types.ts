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
  "id" | "month_key" | "status" | "is_locked" | "created_at" | "locked_at"
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

export type DashboardFinancialProject = {
  projectId: string;
  revenue: number;
  receivedRevenue: number;
  remainingRevenue: number;
  totalCost: number;
  profit: number;
  margin: number | null;
  status: "healthy" | "low_margin" | "loss" | "no_revenue";
};

export type DashboardFinancials = {
  monthId: string;
  monthKey: string | null;
  invoicedRevenue: number;
  receivedRevenue: number;
  remainingRevenue: number;
  totalCost: number;
  paymentsCost: number;
  ikaCost: number;
  materialsCost: number;
  allocatedExpenses: number;
  employeeExpenses: number;
  profit: number;
  margin: number | null;
  projects: DashboardFinancialProject[];
};

export type DashboardMonthlyFinancialTotal = {
  monthId: string;
  monthKey: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number | null;
};

export type DashboardRecentActivity = {
  id: string;
  date: string;
  type: "revenue" | "material" | "expense" | "daily_work" | "payment" | "ika";
  typeLabel: string;
  category: string;
  description: string;
  projectLabel?: string;
  amount?: number;
};

export type DashboardAlert = {
  id: string;
  tone: "amber" | "red" | "blue";
  message: string;
};
