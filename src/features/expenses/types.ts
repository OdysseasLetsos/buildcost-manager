import type { Database } from "@/src/integrations/supabase/types";
import type {
  ExpenseAllocationMethod,
  ExpenseAllocationStatus,
  ExpenseScope,
} from "./constants";

export type Expense = Omit<
  Database["public"]["Tables"]["expenses"]["Row"],
  "scope" | "allocation_method" | "allocation_status"
> & {
  scope: ExpenseScope;
  allocation_method: ExpenseAllocationMethod;
  allocation_status: ExpenseAllocationStatus;
};

export type CompanyOffice = Database["public"]["Tables"]["company_offices"]["Row"];
export type CompanyVehicle =
  Database["public"]["Tables"]["company_vehicles"]["Row"];

export type ExpenseWithRelations = Expense & {
  monthKey: string;
  officeName?: string | null;
  vehicleName?: string | null;
};

export type ExpenseFilters = {
  monthId?: string;
  scope?: ExpenseScope;
  category?: string;
  allocationMethod?: ExpenseAllocationMethod;
  search?: string;
};

export type ExpensesSummary = {
  generalAmount: number;
  officeAmount: number;
  totalAmount: number;
  pendingAmount: number;
};

export type ExpenseAllocationProjectTotal = {
  projectId: string;
  projectCode: string;
  projectName: string;
  allocatedAmount: number;
  basis: number;
  percentage: number;
};

export type ExpenseAllocationWarning = {
  expenseId?: string;
  description: string;
  amount: number;
  message: string;
};

export type ExpenseAllocationPreview = {
  projectTotals: ExpenseAllocationProjectTotal[];
  warnings: ExpenseAllocationWarning[];
};

export type ExpenseActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export type ExpenseResourceActionState<TResource> = {
  ok: boolean;
  message?: string;
  resource?: TResource;
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialExpenseActionState: ExpenseActionState = {
  ok: false,
};

export const initialExpenseResourceActionState = {
  ok: false,
};
