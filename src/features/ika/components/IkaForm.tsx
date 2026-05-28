"use client";

import { useActionState, useEffect } from "react";
import type { Employee } from "@/src/features/employees/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { EmployeeIka, IkaActionState } from "../types";
import { initialIkaActionState } from "../types";

type IkaFormAction = (
  previousState: IkaActionState,
  formData: FormData,
) => Promise<IkaActionState>;

function decimalValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function IkaForm({
  action,
  ika,
  monthlyPeriods,
  employees,
  defaultMonthId,
  submitLabel,
  onSuccess,
}: Readonly<{
  action: IkaFormAction;
  ika?: EmployeeIka;
  monthlyPeriods: MonthlyPeriod[];
  employees: Employee[];
  defaultMonthId: string;
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(action, initialIkaActionState);

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [onSuccess, state.ok]);

  return (
    <form action={formAction} className="grid gap-4">
      {ika ? <input type="hidden" name="id" value={ika.id} /> : null}

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

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Μήνας
          <select
            name="monthId"
            defaultValue={ika?.month_id ?? defaultMonthId}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
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
          Εργαζόμενος
          <select
            name="employeeId"
            defaultValue={ika?.employee_id ?? ""}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Επιλέξτε εργαζόμενο</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ποσό ΙΚΑ
          <input
            name="ikaAmount"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={decimalValue(ika?.ika_amount)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea
          name="notes"
          defaultValue={ika?.notes ?? ""}
          rows={3}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="justify-self-start rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
      >
        {isPending ? "Αποθήκευση..." : submitLabel}
      </button>
    </form>
  );
}
