import type { Database } from "@/src/integrations/supabase/types";
import type { employeeBenefitTypes } from "./constants";

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

export type SuggestedEmployeePayment = {
  employee_id: string;
  month_id: string;
  regular_hours: number;
  overtime_hours: number;
  regular_hourly_rate: number;
  overtime_hourly_rate: number;
  regular_amount: number;
  overtime_amount: number;
  employee_expenses: number;
  suggested_payment_amount: number;
  has_work_entries: boolean;
  has_rates: boolean;
};

export type PreviousPaymentBalanceBreakdown = {
  monthKey: string;
  suggestedAmount: number;
  paidAmount: number;
  remainingAmount: number;
};

export type SuggestedEmployeePaymentWithCarryover = SuggestedEmployeePayment & {
  selected_month_suggested_amount: number;
  previous_months_remaining_amount: number;
  total_suggested_payment_amount: number;
  previous_month_breakdown: PreviousPaymentBalanceBreakdown[];
};

export type PaymentActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export type EmployeeBenefitType = (typeof employeeBenefitTypes)[number];

export type EmployeeBenefit = Omit<
  Database["public"]["Tables"]["employee_benefits"]["Row"],
  "benefit_type"
> & {
  benefit_type: EmployeeBenefitType;
};

export type EmployeeBenefitWithRelations = EmployeeBenefit & {
  employeeName: string;
};

export type BenefitActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialPaymentActionState: PaymentActionState = {
  ok: false,
};

export const initialBenefitActionState: BenefitActionState = {
  ok: false,
};
