export const reportTypes = [
  "monthly_project_summary",
  "employee_work",
  "materials",
  "expenses",
  "revenues",
] as const;

export type ReportType = (typeof reportTypes)[number];

export const reportTypeLabels: Record<ReportType, string> = {
  monthly_project_summary: "Μηνιαία Σύνοψη Έργων",
  employee_work: "Αναφορά Εργαζομένων",
  materials: "Αναφορά Υλικών",
  expenses: "Αναφορά Εξόδων",
  revenues: "Αναφορά Εσόδων",
};

export const reportDescriptions: Record<ReportType, string> = {
  monthly_project_summary:
    "Κόστος, έσοδα και κερδοφορία ανά έργο για τον επιλεγμένο μήνα.",
  employee_work:
    "Ώρες, υπερωρίες, έξοδα εργαζομένων, πληρωμές και ΙΚΑ.",
  materials: "Τιμολόγια υλικών και κατάσταση πληρωμής ανά έργο.",
  expenses: "Γενικά έξοδα και έξοδα έδρας χωρίς οριστική κατανομή.",
  revenues: "Τιμολόγια, εισπράξεις, προκαταβολές και υπόλοιπα πελατών.",
};

export const projectSummaryStatusLabels = {
  healthy: "Υγιές",
  low_margin: "Χαμηλό Περιθώριο",
  loss: "Ζημιά",
  no_revenue: "Χωρίς Έσοδα",
} as const;

export const materialPaymentStatusLabels = {
  pending: "Εκκρεμεί",
  paid: "Πληρωμένο",
} as const;
