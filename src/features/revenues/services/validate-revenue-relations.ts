import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { getProjectById } from "@/src/features/projects/services/get-project-by-id";
import type { RevenueInput } from "../validators";

function isDateInsideMonth(dateValue: string, monthKey: string): boolean {
  return dateValue.startsWith(`${monthKey}-`);
}

export async function validateRevenueRelations(
  companyId: string,
  input: Pick<RevenueInput, "monthId" | "projectId" | "revenueDate">,
) {
  const [monthlyPeriod, project] = await Promise.all([
    requireOpenMonth(input.monthId),
    getProjectById(companyId, input.projectId),
  ]);

  if (monthlyPeriod.company_id !== companyId) {
    throw new Error("Ο μήνας δεν ανήκει στην τρέχουσα εταιρεία.");
  }

  if (!project || project.status === "archived") {
    throw new Error("Το έργο δεν είναι διαθέσιμο για έσοδα.");
  }

  if (!isDateInsideMonth(input.revenueDate, monthlyPeriod.month_key)) {
    throw new Error("Η ημερομηνία εσόδου δεν ανήκει στον επιλεγμένο μήνα.");
  }

  return { monthlyPeriod, project };
}
