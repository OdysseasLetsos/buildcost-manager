import type { Database } from "@/src/integrations/supabase/types";
import type {
  AllocationProjectTotal,
  AllocationWarning,
} from "@/src/features/payments/types";

export type EmployeeIka = Database["public"]["Tables"]["employee_ika"]["Row"];

export type EmployeeIkaWithRelations = EmployeeIka & {
  employeeName: string;
  monthKey: string;
};

export type EmployeeIkaFilters = {
  monthId?: string;
  employeeId?: string;
};

export type IkaSummary = {
  totalRecords: number;
  totalAmount: number;
  employeeCount: number;
};

export type IkaAllocationPreview = {
  projectTotals: AllocationProjectTotal[];
  warnings: AllocationWarning[];
};

export type IkaActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialIkaActionState: IkaActionState = {
  ok: false,
};
