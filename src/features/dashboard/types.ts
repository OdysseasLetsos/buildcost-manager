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
  "id" | "employee_type" | "active"
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
  openMonths: number;
  lockedMonths: number;
  latestMonthlyPeriods: DashboardMonthlyPeriod[];
};

export type DashboardSummaryMetric = {
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "emerald" | "amber" | "slate";
};
