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

export type DashboardSummaryMetric = {
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "emerald" | "amber" | "slate";
};
