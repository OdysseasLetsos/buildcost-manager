import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { getProjectById } from "@/src/features/projects/services/get-project-by-id";
import type { RevenueInput } from "../validators";

function isDateInsideMonth(dateValue: string, monthKey: string): boolean {
  return dateValue.startsWith(`${monthKey}-`);
}

function getTodayDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Athens",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
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

  if (input.revenueDate > getTodayDateKey()) {
    throw new Error("Δεν μπορείτε να καταχωρήσετε έσοδο σε μελλοντική ημερομηνία.");
  }

  return { monthlyPeriod, project };
}
