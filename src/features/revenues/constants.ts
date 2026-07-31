export const revenueTypes = ["invoice", "advance", "payment", "credit"] as const;
export const revenueStatuses = ["pending", "partial", "paid", "cancelled"] as const;
export const revenuePaymentMethods = ["bank", "cash", "other"] as const;

export const revenueTypeLabels = {
  invoice: "Τιμολόγιο",
  advance: "Προκαταβολή",
  payment: "Εξόφληση",
  credit: "Πιστωτικό",
} as const;

export const revenueStatusLabels = {
  pending: "Εκκρεμεί",
  partial: "Μερικώς εξοφλημένο",
  paid: "Εξοφλημένο",
  cancelled: "Ακυρωμένο",
} as const;

export const revenuePaymentMethodLabels = {
  bank: "Τράπεζα",
  cash: "Μετρητά",
  other: "Άλλο",
} as const;

export type RevenueType = (typeof revenueTypes)[number];
export type RevenueStatus = (typeof revenueStatuses)[number];
export type RevenuePaymentMethod = (typeof revenuePaymentMethods)[number];
