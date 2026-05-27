import type { DailyWorkEntry } from "../types";

export function getDailyWorkSummary(entries: DailyWorkEntry[]) {
  return entries.reduce(
    (summary, entry) => ({
      totalHours: summary.totalHours + Number(entry.hours),
      totalOvertimeHours:
        summary.totalOvertimeHours + Number(entry.overtime_hours),
      totalExpenseAmount:
        summary.totalExpenseAmount + Number(entry.expense_amount),
      totalEntries: summary.totalEntries + 1,
    }),
    {
      totalHours: 0,
      totalOvertimeHours: 0,
      totalExpenseAmount: 0,
      totalEntries: 0,
    },
  );
}
