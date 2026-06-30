import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import {
  getCurrentMonthKey,
  isCurrentMonth,
  isFutureMonth,
  isPastMonth,
} from "@/src/features/monthly-periods/services/month-rules";

const APP_TIME_ZONE = "Europe/Athens";

export const PAYMENT_LOCKED_MONTH_ERROR = "Ο μήνας είναι κλειδωμένος.";
export const PAYMENT_LOCKED_MONTH_CORRECTION_ERROR =
  "Ο μήνας πρέπει πρώτα να ξεκλειδωθεί για διορθώσεις.";
export const PAYMENT_FUTURE_MONTH_ERROR =
  "Δεν μπορείτε να καταχωρήσετε πληρωμή σε μελλοντικό μήνα.";

export function getTodayPaymentDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Δεν ήταν δυνατός ο υπολογισμός της σημερινής ημερομηνίας.");
  }

  return `${year}-${month}-${day}`;
}

export function isWritablePaymentMonth(
  period: MonthlyPeriod,
  currentMonthKey = getCurrentMonthKey(),
): boolean {
  if (isFutureMonth(period.month_key, currentMonthKey)) {
    return false;
  }

  if (period.status === "locked" || period.is_locked) {
    return false;
  }

  return (
    isCurrentMonth(period.month_key, currentMonthKey) ||
    isPastMonth(period.month_key, currentMonthKey)
  );
}

export function assertWritablePaymentMonth(
  period: MonthlyPeriod,
  currentMonthKey = getCurrentMonthKey(),
) {
  if (isFutureMonth(period.month_key, currentMonthKey)) {
    throw new Error(PAYMENT_FUTURE_MONTH_ERROR);
  }

  if (period.status === "locked" || period.is_locked) {
    if (isPastMonth(period.month_key, currentMonthKey)) {
      throw new Error(PAYMENT_LOCKED_MONTH_CORRECTION_ERROR);
    }

    throw new Error(PAYMENT_LOCKED_MONTH_ERROR);
  }

  if (
    !isCurrentMonth(period.month_key, currentMonthKey) &&
    !isPastMonth(period.month_key, currentMonthKey)
  ) {
    throw new Error(PAYMENT_FUTURE_MONTH_ERROR);
  }
}
