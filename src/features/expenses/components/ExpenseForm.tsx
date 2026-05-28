"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import {
  allocationMethodLabels,
  expenseAllocationMethods,
  expenseCategoryLabels,
  expenseScopeLabels,
  generalExpenseCategories,
  officeExpenseCategories,
  type ExpenseAllocationMethod,
  type ExpenseScope,
} from "../constants";
import type { Expense, ExpenseActionState } from "../types";
import { initialExpenseActionState } from "../types";

type ExpenseFormAction = (
  previousState: ExpenseActionState,
  formData: FormData,
) => Promise<ExpenseActionState>;

function decimalValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function ExpenseForm({
  action,
  expense,
  monthlyPeriods,
  defaultMonthId,
  defaultScope,
  submitLabel,
  onSuccess,
}: Readonly<{
  action: ExpenseFormAction;
  expense?: Expense;
  monthlyPeriods: MonthlyPeriod[];
  defaultMonthId: string;
  defaultScope: ExpenseScope;
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(action, initialExpenseActionState);
  const [scope, setScope] = useState<ExpenseScope>(expense?.scope ?? defaultScope);
  const [allocationMethod, setAllocationMethod] = useState(
    expense?.allocation_method ?? "by_project_hours",
  );
  const categories = useMemo(
    () => (scope === "general" ? generalExpenseCategories : officeExpenseCategories),
    [scope],
  );

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [onSuccess, state.ok]);

  return (
    <form action={formAction} className="grid gap-4">
      {expense ? <input type="hidden" name="id" value={expense.id} /> : null}
      {state.message ? (
        <p
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}
      {allocationMethod === "manual" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Η χειροκίνητη κατανομή θα υποστηριχθεί σε επόμενη έκδοση.
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Μήνας
          <select
            name="monthId"
            defaultValue={expense?.month_id ?? defaultMonthId}
            required
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
          Ημερομηνία
          <input
            name="expenseDate"
            type="date"
            defaultValue={expense?.expense_date ?? ""}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Τύπος Εξόδου
          <select
            name="scope"
            value={scope}
            onChange={(event) => setScope(event.target.value as ExpenseScope)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="general">{expenseScopeLabels.general}</option>
            <option value="office">{expenseScopeLabels.office}</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Κατηγορία
          <select
            name="category"
            defaultValue={expense?.category ?? categories[0]?.value ?? ""}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {expenseCategoryLabels[category.value]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ποσό
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={decimalValue(expense?.amount)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Μέθοδος Κατανομής
          <select
            name="allocationMethod"
            value={allocationMethod}
            onChange={(event) =>
              setAllocationMethod(event.target.value as ExpenseAllocationMethod)
            }
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            {expenseAllocationMethods.map((method) => (
              <option key={method} value={method}>
                {allocationMethodLabels[method]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Περιγραφή
        <textarea
          name="description"
          defaultValue={expense?.description ?? ""}
          rows={3}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea
          name="notes"
          defaultValue={expense?.notes ?? ""}
          rows={3}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="justify-self-start rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Αποθήκευση..." : submitLabel}
      </button>
    </form>
  );
}
