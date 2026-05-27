import type { Database } from "@/src/integrations/supabase/types";

export const monthlyPeriodStatuses = ["open", "locked"] as const;

export type MonthlyPeriodStatus = (typeof monthlyPeriodStatuses)[number];

export type MonthlyPeriod = Omit<
  Database["public"]["Tables"]["monthly_periods"]["Row"],
  "status"
> & {
  status: MonthlyPeriodStatus;
};

export type MonthlyPeriodActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialMonthlyPeriodActionState: MonthlyPeriodActionState = {
  ok: false,
};
