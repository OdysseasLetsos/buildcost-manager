import type { Database } from "@/src/integrations/supabase/types";

export const employeeTypes = [
  "permanent",
  "daily_worker",
  "subcontractor",
] as const;

export type EmployeeType = (typeof employeeTypes)[number];

export type Employee = Omit<
  Database["public"]["Tables"]["employees"]["Row"],
  "employee_type"
> & {
  employee_type: EmployeeType;
};

export type EmployeeProjectContractStatus = "active" | "completed" | "cancelled";

export type EmployeeProjectContract = Omit<
  Database["public"]["Tables"]["employee_project_contracts"]["Row"],
  "status"
> & {
  status: EmployeeProjectContractStatus;
  project?: {
    code: string;
    name: string;
  } | null;
};

export type EmployeeProjectOption = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "code" | "name"
>;

export type EmployeeFilters = {
  search?: string;
  employeeType?: EmployeeType | "all";
  status?: "active" | "inactive" | "all";
};

export type EmployeeActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialEmployeeActionState: EmployeeActionState = {
  ok: false,
};
