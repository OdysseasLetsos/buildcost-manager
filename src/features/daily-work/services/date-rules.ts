const APP_TIME_ZONE = "Europe/Athens";

export const FUTURE_WORK_DATE_ERROR =
  "Δεν μπορείτε να καταχωρήσετε εργασία για μελλοντική ημερομηνία.";

export const FUTURE_WORK_MONTH_ERROR =
  "Δεν μπορείτε να καταχωρήσετε εργασία σε μελλοντικό μήνα.";

export const NO_CURRENT_OPEN_MONTH_ERROR =
  "Δεν υπάρχει ανοιχτός τρέχων μήνας για καταχώρηση ημερήσιας εργασίας.";

export const OVERTIME_THRESHOLD_HOURS = 8;

export const OVERTIME_NOT_ALLOWED_ERROR =
  "Δεν μπορείτε να καταχωρήσετε υπερωρίες πριν συμπληρωθούν 8 ώρες εργασίας την ίδια ημέρα.";

export const DUPLICATE_DAILY_WORK_ERROR =
  "Υπάρχει ήδη καταχώρηση για τον ίδιο εργαζόμενο, έργο και ημερομηνία.";

export function getTodayDateKey(date = new Date()): string {
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

export function isFutureDate(dateKey: string, todayDateKey = getTodayDateKey()): boolean {
  return dateKey.localeCompare(todayDateKey) > 0;
}
