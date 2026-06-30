import { expenseCategoryLabels, type ExpenseScope } from "../constants";

const categoriesByScope: Record<ExpenseScope, readonly string[]> = {
  general: Object.keys(expenseCategoryLabels),
  office: Object.keys(expenseCategoryLabels),
};

export function validateExpenseCategory(scope: ExpenseScope, category: string) {
  if (!categoriesByScope[scope].includes(category)) {
    throw new Error("Η κατηγορία δεν ταιριάζει με τον τύπο εξόδου.");
  }

  return expenseCategoryLabels[category] ?? category;
}
