"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { Employee } from "@/src/features/employees/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import { employeeBenefitTypeLabels, employeeBenefitTypes } from "../constants";
import type { BenefitActionState, EmployeeBenefit } from "../types";
import { initialBenefitActionState } from "../types";

type BenefitFormAction = (
  previousState: BenefitActionState,
  formData: FormData,
) => Promise<BenefitActionState>;

function decimalValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

function defaultDateForMonth(period: MonthlyPeriod | undefined, todayDate: string): string {
  if (!period) return todayDate;
  if (period.month_key < todayDate.slice(0, 7)) return period.ends_on;
  return todayDate;
}

export function BenefitForm({
  action,
  benefit,
  monthlyPeriods,
  employees,
  defaultMonthId,
  todayDate,
  submitLabel,
  onSuccess,
}: Readonly<{
  action: BenefitFormAction;
  benefit?: EmployeeBenefit;
  monthlyPeriods: MonthlyPeriod[];
  employees: Employee[];
  defaultMonthId: string;
  todayDate: string;
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialBenefitActionState,
  );
  const initialMonth =
    monthlyPeriods.find((period) => period.month_key === benefit?.month_key)?.id ??
    defaultMonthId;
  const [monthId, setMonthId] = useState(initialMonth);
  const selectedMonth = useMemo(
    () => monthlyPeriods.find((period) => period.id === monthId),
    [monthId, monthlyPeriods],
  );
  const [benefitDate, setBenefitDate] = useState(
    benefit?.benefit_date ?? defaultDateForMonth(selectedMonth, todayDate),
  );
  const dateMin = selectedMonth?.starts_on ?? undefined;
  const dateMax =
    selectedMonth && selectedMonth.ends_on < todayDate
      ? selectedMonth.ends_on
      : todayDate;

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [onSuccess, state.ok]);

  return (
    <form action={formAction} className="grid gap-4">
      {benefit ? <input type="hidden" name="id" value={benefit.id} /> : null}

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
            value={monthId}
            onChange={(event) => {
              const nextMonthId = event.target.value;
              const nextMonth = monthlyPeriods.find(
                (period) => period.id === nextMonthId,
              );
              setMonthId(nextMonthId);
              setBenefitDate(defaultDateForMonth(nextMonth, todayDate));
            }}
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
            defaultValue={benefit?.employee_id ?? ""}
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
          Τύπος
          <select
            name="benefitType"
            defaultValue={benefit?.benefit_type ?? "allowance"}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          >
            {employeeBenefitTypes.map((type) => (
              <option key={type} value={type}>
                {employeeBenefitTypeLabels[type]}
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
            defaultValue={decimalValue(benefit?.amount)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ημερομηνία
          <input
            name="benefitDate"
            type="date"
            value={benefitDate}
            onChange={(event) => setBenefitDate(event.target.value)}
            min={dateMin}
            max={dateMax}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea
          name="notes"
          defaultValue={benefit?.notes ?? ""}
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
