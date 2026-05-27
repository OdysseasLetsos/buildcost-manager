"use client";

import { useActionState, useEffect } from "react";
import type { Employee, EmployeeActionState } from "../types";
import { employeeTypes, initialEmployeeActionState } from "../types";
import { employeeTypeLabels } from "./EmployeeTypeBadge";

type EmployeeFormAction = (
  previousState: EmployeeActionState,
  formData: FormData,
) => Promise<EmployeeActionState>;

function formatRateValue(value: number | null): string {
  return value === null ? "" : String(value);
}

export function EmployeeForm({
  action,
  employee,
  submitLabel,
  onSuccess,
}: Readonly<{
  action: EmployeeFormAction;
  employee?: Employee;
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialEmployeeActionState,
  );

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
  }, [onSuccess, state.ok]);

  return (
    <form action={formAction} className="grid gap-4">
      {employee ? <input type="hidden" name="employeeId" value={employee.id} /> : null}

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
          Ονοματεπώνυμο
          <input
            name="fullName"
            defaultValue={employee?.full_name ?? ""}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          {state.fieldErrors?.fullName ? (
            <span className="text-xs text-red-700">
              {state.fieldErrors.fullName}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Τύπος εργαζομένου
          <select
            name="employeeType"
            defaultValue={employee?.employee_type ?? "permanent"}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          >
            {employeeTypes.map((employeeType) => (
              <option key={employeeType} value={employeeType}>
                {employeeTypeLabels[employeeType]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ημερομίσθιο
          <input
            name="dailyRate"
            type="number"
            min="0"
            step="0.01"
            defaultValue={formatRateValue(employee?.daily_rate ?? null)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          {state.fieldErrors?.dailyRate ? (
            <span className="text-xs text-red-700">
              {state.fieldErrors.dailyRate}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ωρομίσθιο
          <input
            name="hourlyRate"
            type="number"
            min="0"
            step="0.01"
            defaultValue={formatRateValue(employee?.hourly_rate ?? null)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          {state.fieldErrors?.hourlyRate ? (
            <span className="text-xs text-red-700">
              {state.fieldErrors.hourlyRate}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Κατάσταση
          <select
            name="active"
            defaultValue={employee?.active === false ? "false" : "true"}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          >
            <option value="true">Ενεργός</option>
            <option value="false">Ανενεργός</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea
          name="notes"
          defaultValue={employee?.notes ?? ""}
          rows={4}
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
