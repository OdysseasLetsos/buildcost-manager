export const expenseScopes = ["general", "office"] as const;

export const expenseAllocationMethods = [
  "by_project_hours",
  "by_project_revenue",
  "equal_per_active_project",
  "manual",
] as const;

export const expenseAllocationStatuses = ["pending", "allocated"] as const;

export const generalExpenseCategories = [
  { value: "pos", label: "POS" },
  { value: "invoice_issuing", label: "Έκδοση τιμολογίων" },
  { value: "fmy_tax", label: "ΦΜΥ" },
  { value: "vat_tax", label: "ΦΠΑ" },
  { value: "fee_tax", label: "ΦΕΕ" },
  { value: "accountant", label: "Λογιστής" },
  { value: "safety_technician", label: "Τεχνικός ασφαλείας" },
  { value: "chambers", label: "Επιμελητήρια" },
] as const;

export const officeExpenseCategories = [
  { value: "rent", label: "Ενοίκιο / Σπίτι" },
  { value: "electricity", label: "ΔΕΗ" },
  { value: "water", label: "Νερό" },
  { value: "phone", label: "Τηλέφωνο" },
  { value: "tools", label: "Εργαλεία" },
  { value: "nissan_vanette", label: "Nissan Vanette" },
  { value: "fuel", label: "Καύσιμα" },
  { value: "transport", label: "Μεταφορικά" },
] as const;

export const expenseCategoryLabels: Record<string, string> = Object.fromEntries(
  [...generalExpenseCategories, ...officeExpenseCategories].map((category) => [
    category.value,
    category.label,
  ]),
);

export const expenseScopeLabels = {
  general: "Γενικά Έξοδα",
  office: "Έξοδα Έδρας",
} as const;

export const allocationMethodLabels = {
  by_project_hours: "Με βάση ώρες έργου",
  by_project_revenue: "Με βάση έσοδα έργου",
  equal_per_active_project: "Ισόποσα σε ενεργά έργα",
  manual: "Χειροκίνητα",
} as const;

export const allocationStatusLabels = {
  pending: "Εκκρεμεί",
  allocated: "Κατανεμημένο",
} as const;

export type ExpenseScope = (typeof expenseScopes)[number];
export type ExpenseAllocationMethod = (typeof expenseAllocationMethods)[number];
export type ExpenseAllocationStatus = (typeof expenseAllocationStatuses)[number];
