import { getMonthlyPeriodById } from "@/src/features/monthly-periods/services/get-monthly-period-by-id";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { getEmployeeById } from "@/src/features/employees/services/get-employee-by-id";
import { getProjectById } from "@/src/features/projects/services/get-project-by-id";
import type { DailyWorkInput } from "../validators";

function isDateInsideMonth(workDate: string, monthKey: string): boolean {
  return workDate.startsWith(`${monthKey}-`);
}

export async function validateDailyWorkRelations(
  companyId: string,
  input: DailyWorkInput,
) {
  const monthlyPeriod = await requireOpenMonth(input.monthId);

  if (monthlyPeriod.company_id !== companyId) {
    throw new Error("Ο μήνας δεν ανήκει στην τρέχουσα εταιρεία.");
  }

  const [employee, project, selectedMonth] = await Promise.all([
    getEmployeeById(companyId, input.employeeId),
    getProjectById(companyId, input.projectId),
    getMonthlyPeriodById(companyId, input.monthId),
  ]);

  if (!selectedMonth || selectedMonth.id !== monthlyPeriod.id) {
    throw new Error("Ο μήνας δεν βρέθηκε.");
  }

  if (!employee || !employee.active) {
    throw new Error("Ο εργαζόμενος δεν είναι ενεργός.");
  }

  if (!project || project.status === "archived") {
    throw new Error("Το έργο δεν είναι διαθέσιμο για καταχώρηση.");
  }

  if (!isDateInsideMonth(input.workDate, selectedMonth.month_key)) {
    throw new Error("Η ημερομηνία εργασίας δεν ανήκει στον επιλεγμένο μήνα.");
  }

  return { monthlyPeriod: selectedMonth, employee, project };
}
