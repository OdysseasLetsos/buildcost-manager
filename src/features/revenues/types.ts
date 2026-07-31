import type { Database } from "@/src/integrations/supabase/types";
import type { RevenuePaymentMethod, RevenueStatus, RevenueType } from "./constants";

export type Revenue = Omit<
  Database["public"]["Tables"]["revenues"]["Row"],
  "payment_method" | "revenue_type" | "status"
> & {
  payment_method: RevenuePaymentMethod;
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
