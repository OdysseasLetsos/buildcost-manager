import {
  expenseCategoryLabels,
  generalExpenseCategories,
  officeExpenseCategories,
  type ExpenseScope,
} from "../constants";

const categoriesByScope: Record<ExpenseScope, readonly string[]> = {
  general: generalExpenseCategories.map((category) => category.value),
  office: officeExpenseCategories.map((category) => category.value),
};

export function validateExpenseCategory(scope: ExpenseScope, category: string) {
  if (!categoriesByScope[scope].includes(category)) {
    throw new Error("Η κατηγορία δεν ταιριάζει με τον τύπο εξόδου.");
  }

  return expenseCategoryLabels[category] ?? category;
}
