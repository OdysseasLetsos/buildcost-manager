"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { Employee } from "@/src/features/employees/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import type { DailyWorkActionState, DailyWorkEntry } from "../types";
import { initialDailyWorkActionState } from "../types";

type DailyWorkFormAction = (
  previousState: DailyWorkActionState,
  formData: FormData,
) => Promise<DailyWorkActionState>;

function decimalValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

function defaultDateForMonth(period: MonthlyPeriod | undefined, todayDate: string): string {
  if (!period) {
    return todayDate;
  }

  if (period.month_key < todayDate.slice(0, 7)) {
    return period.ends_on;
  }

  return todayDate;
}

export function DailyWorkForm({
  action,
  entry,
  monthlyPeriods,
  employees,
  projects,
  defaultMonthId,
  todayDate,
  submitLabel,
  onSuccess,
}: Readonly<{
  action: DailyWorkFormAction;
  entry?: DailyWorkEntry;
  monthlyPeriods: MonthlyPeriod[];
  employees: Employee[];
  projects: Project[];
  defaultMonthId: string;
  todayDate: string;
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialDailyWorkActionState,
  );
  const [selectedMonthId, setSelectedMonthId] = useState(
    entry?.month_id ?? defaultMonthId,
  );
  const selectedMonth = useMemo(
    () => monthlyPeriods.find((period) => period.id === selectedMonthId),
    [monthlyPeriods, selectedMonthId],
  );
  const [workDate, setWorkDate] = useState(
    entry?.work_date ?? defaultDateForMonth(selectedMonth, todayDate),
  );
  const dateMin = selectedMonth?.starts_on ?? undefined;
  const dateMax =
    selectedMonth && selectedMonth.ends_on < todayDate
      ? selectedMonth.ends_on
      : todayDate;

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
  }, [onSuccess, state.ok]);

  return (
    <form action={formAction} className="grid gap-4">
      {entry ? <input type="hidden" name="entryId" value={entry.id} /> : null}

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
            value={selectedMonthId}
            onChange={(event) => {
              const nextMonthId = event.target.value;
              const nextMonth = monthlyPeriods.find((period) => period.id === nextMonthId);
              setSelectedMonthId(nextMonthId);
              setWorkDate(defaultDateForMonth(nextMonth, todayDate));
            }}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Επιλέξτε μήνα</option>
            {monthlyPeriods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.month_key}
                {period.month_key < todayDate.slice(0, 7)
                  ? " - ξεκλείδωτος για διορθώσεις"
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ημερομηνία
          <input
            name="workDate"
            type="date"
            value={workDate}
            onChange={(event) => setWorkDate(event.target.value)}
            min={dateMin}
            max={dateMax}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          <span className="text-xs font-normal text-slate-500">
            Δεν επιτρέπονται μελλοντικές ημερομηνίες.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Εργαζόμενος
          <select
            name="employeeId"
            defaultValue={entry?.employee_id ?? ""}
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
          Έργο
          <select
            name="projectId"
            defaultValue={entry?.project_id ?? ""}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Επιλέξτε έργο</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ώρες
          <input
            name="hours"
            type="number"
            min="0"
            step="0.25"
            defaultValue={decimalValue(entry?.hours)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Υπερωρίες
          <input
            name="overtimeHours"
            type="number"
            min="0"
            step="0.25"
            defaultValue={decimalValue(entry?.overtime_hours)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          <span className="text-xs font-normal text-slate-500">
            Οι υπερωρίες επιτρέπονται μόνο αφού συμπληρωθούν 8 ώρες εργασίας
            την ίδια ημέρα.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Έξοδα
          <input
            name="expenseAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={decimalValue(entry?.expense_amount)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Περιγραφή Εξόδου
          <input
            name="expenseDescription"
            defaultValue={entry?.expense_description ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Περιγραφή Εργασίας
        <textarea
          name="workDescription"
          defaultValue={entry?.work_description ?? ""}
          rows={3}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea
          name="notes"
          defaultValue={entry?.notes ?? ""}
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
