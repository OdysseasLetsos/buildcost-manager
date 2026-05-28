import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import type { ExpenseInput } from "../validators";
import { validateExpenseCategory } from "./validate-expense-category";

function isDateInsideMonth(dateValue: string, monthKey: string): boolean {
  return dateValue.startsWith(`${monthKey}-`);
}

export async function validateExpenseRelations(
  companyId: string,
  input: Pick<
    ExpenseInput,
    "monthId" | "expenseDate" | "scope" | "category" | "allocationMethod"
  >,
) {
  validateExpenseCategory(input.scope, input.category);

  const monthlyPeriod = await requireOpenMonth(input.monthId);

  if (monthlyPeriod.company_id !== companyId) {
    throw new Error("Ο μήνας δεν ανήκει στην τρέχουσα εταιρεία.");
  }

  if (!isDateInsideMonth(input.expenseDate, monthlyPeriod.month_key)) {
    throw new Error("Η ημερομηνία εξόδου δεν ανήκει στον επιλεγμένο μήνα.");
  }

  if (input.allocationMethod === "manual") {
    return {
      monthlyPeriod,
      warning: "Η χειροκίνητη κατανομή θα υποστηριχθεί σε επόμενη έκδοση.",
    };
  }

  return { monthlyPeriod, warning: null };
}
