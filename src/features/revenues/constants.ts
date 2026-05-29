export const revenueTypes = ["invoice", "advance", "payment", "credit"] as const;
export const revenueStatuses = ["pending", "partial", "paid", "cancelled"] as const;

export const revenueTypeLabels = {
  invoice: "Τιμολόγιο",
  advance: "Προκαταβολή",
  payment: "Εξόφληση",
  credit: "Πιστωτικό",
} as const;

export const revenueStatusLabels = {
  pending: "Εκκρεμεί",
  partial: "Μερικώς",
  paid: "Εξοφλημένο",
  cancelled: "Ακυρωμένο",
} as const;

export type RevenueType = (typeof revenueTypes)[number];
export type RevenueStatus = (typeof revenueStatuses)[number];
