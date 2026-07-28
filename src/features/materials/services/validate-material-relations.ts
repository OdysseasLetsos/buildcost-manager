import { getMonthlyPeriodById } from "@/src/features/monthly-periods/services/get-monthly-period-by-id";
import {
  getCurrentMonthKey,
  isCurrentMonth,
  isFutureMonth,
  isPastMonth,
} from "@/src/features/monthly-periods/services/month-rules";
import { getProjectById } from "@/src/features/projects/services/get-project-by-id";
import type { MaterialInput } from "../validators";

function isDateInsideMonth(dateValue: string, monthKey: string): boolean {
  return dateValue.startsWith(`${monthKey}-`);
}

export async function validateMaterialRelations(
  companyId: string,
  input: Pick<MaterialInput, "monthId" | "projectId" | "invoiceDate">,
) {
  const [monthlyPeriod, project] = await Promise.all([
    getMonthlyPeriodById(companyId, input.monthId),
    getProjectById(companyId, input.projectId),
  ]);

  if (!monthlyPeriod) {
    throw new Error("Ο μήνας δεν βρέθηκε.");
  }

  if (monthlyPeriod.company_id !== companyId) {
    throw new Error("Ο μήνας δεν ανήκει στην τρέχουσα εταιρεία.");
  }

  const currentMonthKey = getCurrentMonthKey();

  if (isFutureMonth(monthlyPeriod.month_key, currentMonthKey)) {
    throw new Error(
      "Δεν μπορείτε να καταχωρήσετε τιμολόγιο υλικών σε μελλοντικό μήνα.",
    );
  }

  if (monthlyPeriod.status === "locked" || monthlyPeriod.is_locked) {
    if (isPastMonth(monthlyPeriod.month_key, currentMonthKey)) {
      throw new Error(
        "Ο μήνας πρέπει πρώτα να ξεκλειδωθεί για διορθώσεις.",
      );
    }

    throw new Error("Ο μήνας είναι κλειδωμένος.");
  }

  if (
    !isCurrentMonth(monthlyPeriod.month_key, currentMonthKey) &&
    !isPastMonth(monthlyPeriod.month_key, currentMonthKey)
  ) {
    throw new Error(
      "Δεν μπορείτε να καταχωρήσετε τιμολόγιο υλικών σε μελλοντικό μήνα.",
    );
  }

  if (!project || project.status === "archived") {
    throw new Error("Το έργο δεν είναι διαθέσιμο για τιμολόγιο υλικών.");
  }

  if (!isDateInsideMonth(input.invoiceDate, monthlyPeriod.month_key)) {
    throw new Error(
      "Η ημερομηνία τιμολογίου πρέπει να ανήκει στον επιλεγμένο μήνα.",
    );
  }

  return { monthlyPeriod, project };
}
