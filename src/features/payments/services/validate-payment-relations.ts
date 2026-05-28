import { getEmployeeById } from "@/src/features/employees/services/get-employee-by-id";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";

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
    requireOpenMonth(input.monthId),
    getEmployeeById(companyId, input.employeeId),
  ]);

  if (monthlyPeriod.company_id !== companyId) {
    throw new Error("Ο μήνας δεν ανήκει στην τρέχουσα εταιρεία.");
  }

  if (!employee || !employee.active) {
    throw new Error("Ο εργαζόμενος δεν είναι ενεργός.");
  }

  if (!isDateInsideMonth(input.paymentDate, monthlyPeriod.month_key)) {
    throw new Error("Η ημερομηνία πληρωμής δεν ανήκει στον επιλεγμένο μήνα.");
  }

  return { monthlyPeriod, employee };
}
