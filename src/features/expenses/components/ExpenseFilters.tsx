"use client";

import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import {
  allocationMethodLabels,
  expenseAllocationMethods,
  expenseCategoryLabels,
  generalExpenseCategories,
  officeExpenseCategories,
  type ExpenseAllocationMethod,
  type ExpenseScope,
} from "../constants";

export function ExpenseFilters({
  monthId,
  scope,
  category,
  allocationMethod,
  search,
  monthlyPeriods,
  onMonthChange,
  onCategoryChange,
  onAllocationMethodChange,
  onSearchChange,
}: Readonly<{
  monthId: string;
  scope: ExpenseScope;
  category: string;
  allocationMethod: string;
  search: string;
  monthlyPeriods: MonthlyPeriod[];
  onMonthChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAllocationMethodChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}>) {
  const categories = scope === "general" ? generalExpenseCategories : officeExpenseCategories;

  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Μήνας
        <select
          value={monthId}
          onChange={(event) => onMonthChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">Επιλέξτε μήνα</option>
          {monthlyPeriods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.month_key}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Κατηγορία
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">Όλες</option>
          {categories.map((item) => (
            <option key={item.value} value={item.value}>
              {expenseCategoryLabels[item.value]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Μέθοδος Κατανομής
        <select
          value={allocationMethod}
          onChange={(event) => onAllocationMethodChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">Όλες</option>
          {expenseAllocationMethods.map((method: ExpenseAllocationMethod) => (
            <option key={method} value={method}>
              {allocationMethodLabels[method]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Αναζήτηση
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
    </section>
  );
}
