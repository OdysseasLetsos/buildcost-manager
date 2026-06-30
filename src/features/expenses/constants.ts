export const expenseScopes = ["general", "office"] as const;

export const expenseAllocationMethods = [
  "by_project_hours",
  "by_project_revenue",
  "equal_per_active_project",
  "manual",
] as const;

export const expenseAllocationStatuses = ["pending", "allocated"] as const;

export const generalExpenseCategories = [
  { value: "office", label: "Γραφείο" },
  { value: "transport", label: "Μεταφορικά" },
  { value: "accountant", label: "Λογιστής" },
  { value: "taxes", label: "Φόροι" },
  { value: "other", label: "Άλλο" },
] as const;

export const officeExpenseCategories = generalExpenseCategories;

const legacyExpenseCategoryLabels: Record<string, string> = {
  pos: "POS",
  invoice_issuing: "Έκδοση τιμολογίων",
  fmy_tax: "ΦΜΥ",
  vat_tax: "ΦΠΑ",
  fee_tax: "ΦΕΕ",
  safety_technician: "Τεχνικός ασφαλείας",
  chambers: "Επιμελητήρια",
  rent: "Ενοίκιο / Σπίτι",
  electricity: "ΔΕΗ",
  water: "Νερό",
  phone: "Τηλέφωνο",
  tools: "Εργαλεία",
  nissan_vanette: "Nissan Vanette",
  fuel: "Καύσιμα",
};

export const expenseCategoryLabels: Record<string, string> = {
  ...Object.fromEntries(
    generalExpenseCategories.map((category) => [category.value, category.label]),
  ),
  ...legacyExpenseCategoryLabels,
};

export const expenseScopeLabels = {
  general: "Γενικά Έξοδα",
  office: "Γενικά Έξοδα",
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
