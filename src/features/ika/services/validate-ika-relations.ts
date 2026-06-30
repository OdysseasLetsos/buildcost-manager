import { getEmployeeById } from "@/src/features/employees/services/get-employee-by-id";
import { getMonthlyPeriodById } from "@/src/features/monthly-periods/services/get-monthly-period-by-id";
import { assertWritablePaymentMonth } from "@/src/features/payments/services/payment-month-rules";

export async function validateIkaRelations(
  companyId: string,
  input: {
    monthId: string;
    employeeId: string;
  },
) {
  const [monthlyPeriod, employee] = await Promise.all([
    getMonthlyPeriodById(companyId, input.monthId),
    getEmployeeById(companyId, input.employeeId),
  ]);

  if (!monthlyPeriod) {
    throw new Error("Ο μήνας δεν βρέθηκε.");
  }

  assertWritablePaymentMonth(monthlyPeriod);

  if (!employee || !employee.active) {
    throw new Error("Ο εργαζόμενος δεν είναι ενεργός.");
  }

  return { monthlyPeriod, employee };
}
