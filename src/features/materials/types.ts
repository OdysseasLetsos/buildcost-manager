import type { Database } from "@/src/integrations/supabase/types";

export type Material = Database["public"]["Tables"]["materials"]["Row"];

export type MaterialWithRelations = Material & {
  projectCode: string;
  projectName: string;
  monthKey: string;
};

export type MaterialFilters = {
  monthId?: string;
  projectId?: string;
  supplierName?: string;
  paymentStatus?: string;
  search?: string;
};

export type MaterialsSummary = {
  totalAmount: number;
  invoiceCount: number;
  paidAmount: number;
  pendingAmount: number;
  topSupplier: string | null;
};

export type MaterialsByProjectTotal = {
  projectId: string;
  projectCode: string;
  projectName: string;
  totalAmount: number;
  percentage: number;
};

export type MaterialActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialMaterialActionState: MaterialActionState = {
  ok: false,
};
