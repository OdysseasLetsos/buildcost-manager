import type { Database } from "@/src/integrations/supabase/types";
import type { RevenueStatus, RevenueType } from "./constants";

export type Revenue = Omit<
  Database["public"]["Tables"]["revenues"]["Row"],
  "revenue_type" | "status"
> & {
  revenue_type: RevenueType;
  status: RevenueStatus;
};

export type RevenueWithRelations = Revenue & {
  projectCode: string;
  projectName: string;
  monthKey: string;
};

export type RevenueFilters = {
  monthId?: string;
  projectId?: string;
  clientName?: string;
  revenueType?: RevenueType;
  status?: RevenueStatus;
  search?: string;
};

export type RevenuesSummary = {
  invoicedAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  totalRevenue: number;
};

export type RevenuesByProjectTotal = {
  projectId: string;
  projectCode: string;
  projectName: string;
  invoicedAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  percentage: number;
};

export type RevenueActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialRevenueActionState: RevenueActionState = {
  ok: false,
};
