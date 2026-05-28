import { getEmployeeById } from "@/src/features/employees/services/get-employee-by-id";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";

export async function validateIkaRelations(
  companyId: string,
  input: {
    monthId: string;
    employeeId: string;
  },
) {
  const [monthlyPeriod, employee] = await Promise.all([
    requireOpenMonth(input.monthId),
    getEmployeeById(companyId, input.employeeId),
  ]);

  if (monthlyPeriod.company_id !== companyId) {
    throw new Error("Ο μήνας δεν ανήκει στην τρέχουσα εταιρεία.");
  }

  if (!employee || !employee.active) {
    throw new Error("Ο εργαζόμενος δεν είναι ενεργός.");
  }

  return { monthlyPeriod, employee };
}
