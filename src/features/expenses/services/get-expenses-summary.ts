import type { ExpenseWithRelations, ExpensesSummary } from "../types";

export function getExpensesSummary(expenses: ExpenseWithRelations[]): ExpensesSummary {
  return expenses.reduce<ExpensesSummary>(
    (summary, expense) => {
      if (expense.scope === "general") summary.generalAmount += expense.amount;
      if (expense.scope === "office") summary.officeAmount += expense.amount;
      if (expense.allocation_status === "pending") {
        summary.pendingAmount += expense.amount;
      }
      summary.totalAmount += expense.amount;
      return summary;
    },
    {
      generalAmount: 0,
      officeAmount: 0,
      totalAmount: 0,
      pendingAmount: 0,
    },
  );
}
