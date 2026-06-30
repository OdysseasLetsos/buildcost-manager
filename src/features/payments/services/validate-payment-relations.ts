import { getEmployeeById } from "@/src/features/employees/services/get-employee-by-id";
import { getMonthlyPeriodById } from "@/src/features/monthly-periods/services/get-monthly-period-by-id";
import { assertWritablePaymentMonth } from "./payment-month-rules";

function isDateInsideMonth(dateValue: string, monthKey: string): boolean {
  return dateValue.startsWith(`${monthKey}-`);
}

export async function validatePaymentRelations(
  companyId: string,
  input: {
    monthId: string;
    employeeId: string;
    paymentDate: string;
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

  if (!isDateInsideMonth(input.paymentDate, monthlyPeriod.month_key)) {
    throw new Error("Η ημερομηνία πληρωμής δεν ανήκει στον επιλεγμένο μήνα.");
  }

  return { monthlyPeriod, employee };
}
