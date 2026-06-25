const APP_TIME_ZONE = "Europe/Athens";

export const FUTURE_MONTH_ERROR =
  "Δεν μπορείτε να δημιουργήσετε ή να ανοίξετε μελλοντικό μήνα πριν ξεκινήσει ημερολογιακά.";

export const LOCKED_MONTH_ERROR = "Ο μήνας είναι κλειδωμένος.";

export const LOCKED_MONTH_CORRECTION_ERROR =
  "Ο μήνας πρέπει πρώτα να ξεκλειδωθεί για διορθώσεις.";

export function getCurrentMonthKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  if (!year || !month) {
    throw new Error("Δεν ήταν δυνατός ο υπολογισμός του τρέχοντος μήνα.");
  }

  return `${year}-${month}`;
}

export function compareMonthKeys(left: string, right: string): number {
  return left.localeCompare(right);
}

export function isFutureMonth(
  monthKey: string,
  currentMonthKey = getCurrentMonthKey(),
): boolean {
  return compareMonthKeys(monthKey, currentMonthKey) > 0;
}

export function isCurrentMonth(
  monthKey: string,
  currentMonthKey = getCurrentMonthKey(),
): boolean {
  return monthKey === currentMonthKey;
}

export function isPastMonth(
  monthKey: string,
  currentMonthKey = getCurrentMonthKey(),
): boolean {
  return compareMonthKeys(monthKey, currentMonthKey) < 0;
}
