import type { Database } from "@/src/integrations/supabase/types";
import type { Employee } from "@/src/features/employees/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";

export type DailyWorkEntry =
  Database["public"]["Tables"]["daily_work_entries"]["Row"];

export type DailyWorkFormOptionData = {
  projects: Project[];
  employees: Employee[];
  monthlyPeriods: MonthlyPeriod[];
};

export type DailyWorkEntryWithRelations = DailyWorkEntry & {
  employeeName: string;
  projectName: string;
  projectCode: string;
  monthKey: string;
};

export type DailyWorkFilters = {
  monthId?: string;
  workDate?: string;
  employeeId?: string;
  projectId?: string;
};

export type DailyWorkSummary = {
  totalHours: number;
  totalOvertimeHours: number;
  totalExpenseAmount: number;
  totalEntries: number;
};

export type DailyWorkActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialDailyWorkActionState: DailyWorkActionState = {
  ok: false,
};
