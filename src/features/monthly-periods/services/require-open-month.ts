import { requireUser } from "@/src/core/auth";
import { getCurrentCompany } from "@/src/core/tenants";
import { getMonthlyPeriodById } from "./get-monthly-period-by-id";
import {
  FUTURE_MONTH_ERROR,
  LOCKED_MONTH_CORRECTION_ERROR,
  LOCKED_MONTH_ERROR,
  getCurrentMonthKey,
  isCurrentMonth,
  isFutureMonth,
  isPastMonth,
} from "./month-rules";

export async function requireOpenMonth(monthId: string) {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    throw new Error("Δεν βρέθηκε ενεργή εταιρεία.");
  }

  const monthlyPeriod = await getMonthlyPeriodById(
    currentCompany.company.id,
    monthId,
  );

  if (!monthlyPeriod) {
    throw new Error("Ο μήνας δεν βρέθηκε.");
  }

  const currentMonthKey = getCurrentMonthKey();

  if (isFutureMonth(monthlyPeriod.month_key, currentMonthKey)) {
    throw new Error(FUTURE_MONTH_ERROR);
  }

  if (monthlyPeriod.status === "locked" || monthlyPeriod.is_locked) {
    if (isPastMonth(monthlyPeriod.month_key, currentMonthKey)) {
      throw new Error(LOCKED_MONTH_CORRECTION_ERROR);
    }

    throw new Error(LOCKED_MONTH_ERROR);
  }

  if (
    !isCurrentMonth(monthlyPeriod.month_key, currentMonthKey) &&
    !isPastMonth(monthlyPeriod.month_key, currentMonthKey)
  ) {
    throw new Error(FUTURE_MONTH_ERROR);
  }

  return monthlyPeriod;
}
