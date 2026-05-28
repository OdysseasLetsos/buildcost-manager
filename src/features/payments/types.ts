import type { Database } from "@/src/integrations/supabase/types";

export type EmployeePayment =
  Database["public"]["Tables"]["employee_payments"]["Row"];

export type EmployeePaymentWithRelations = EmployeePayment & {
  employeeName: string;
  monthKey: string;
};

export type EmployeePaymentFilters = {
  monthId?: string;
  employeeId?: string;
  paymentMethod?: string;
};

export type PaymentsSummary = {
  totalPayments: number;
  totalAmount: number;
  employeeCount: number;
};

export type AllocationProjectTotal = {
  projectId: string;
  projectCode: string;
  projectName: string;
  allocatedAmount: number;
  workUnits: number;
  percentage: number;
};

export type AllocationWarning = {
  employeeId: string;
  employeeName: string;
  amount: number;
  message: string;
};

export type PaymentAllocationPreview = {
  projectTotals: AllocationProjectTotal[];
  warnings: AllocationWarning[];
};

export type PaymentActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialPaymentActionState: PaymentActionState = {
  ok: false,
};
