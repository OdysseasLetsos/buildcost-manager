import { getEmployeeById } from "@/src/features/employees/services/get-employee-by-id";
import { getMonthlyPeriodById } from "@/src/features/monthly-periods/services/get-monthly-period-by-id";
import { assertWritablePaymentMonth, getTodayPaymentDateKey } from "./payment-month-rules";
import type { BenefitInput } from "../benefit-validators";

function isDateInsideMonth(dateValue: string, monthKey: string): boolean {
  return dateValue.startsWith(`${monthKey}-`);
}

export async function validateBenefitRelations(
  companyId: string,
  input: BenefitInput,
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

  if (input.benefitDate > getTodayPaymentDateKey()) {
    throw new Error("Δεν μπορείτε να καταχωρήσετε εγγραφή σε μελλοντική ημερομηνία.");
  }

  if (!isDateInsideMonth(input.benefitDate, monthlyPeriod.month_key)) {
    throw new Error("Η ημερομηνία δεν ανήκει στον επιλεγμένο μήνα.");
  }

  return { monthlyPeriod, employee };
}
