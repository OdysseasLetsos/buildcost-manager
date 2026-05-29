import {
  allocationMethodLabels,
  expenseCategoryLabels,
  expenseScopeLabels,
} from "@/src/features/expenses/constants";
import { getExpenses } from "@/src/features/expenses/services/get-expenses";
import type { ExpensesReportRow } from "../types";
import { requireReportsAccess } from "./require-reports-access";

export async function getExpensesReport({
  companyId,
  monthId,
}: {
  companyId: string;
  monthId: string;
}): Promise<ExpensesReportRow[]> {
  await requireReportsAccess(companyId);
  const expenses = await getExpenses(companyId, { monthId });

  return expenses.map((expense) => ({
    id: expense.id,
    expenseDate: expense.expense_date,
    scope: expenseScopeLabels[expense.scope] ?? expense.scope,
    category: expenseCategoryLabels[expense.category] ?? expense.category,
    description: expense.description ?? "",
    amount: Number(expense.amount ?? 0),
    allocationMethod:
      allocationMethodLabels[expense.allocation_method] ?? expense.allocation_method,
  }));
}
