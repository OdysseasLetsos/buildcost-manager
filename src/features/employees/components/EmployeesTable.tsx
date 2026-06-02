"use client";

import { useActionState } from "react";
import { deactivateEmployee } from "../actions/deactivate-employee";
import { reactivateEmployee } from "../actions/reactivate-employee";
import type { Employee } from "../types";
import { initialEmployeeActionState } from "../types";
import { EmployeeStatusBadge } from "./EmployeeStatusBadge";
import { EmployeeTypeBadge } from "./EmployeeTypeBadge";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function formatRate(value: number | null): string {
  return value === null ? "-" : currencyFormatter.format(value);
}

function EmployeeActiveToggle({ employee }: Readonly<{ employee: Employee }>) {
  const [state, formAction, isPending] = useActionState(
    employee.active ? deactivateEmployee : reactivateEmployee,
    initialEmployeeActionState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="employeeId" value={employee.id} />
      <button
        type="submit"
        disabled={isPending}
        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
          employee.active
            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        {isPending
          ? "..."
          : employee.active
            ? "Απενεργοποίηση"
            : "Επανενεργοποίηση"}
      </button>
      {state.message && !state.ok ? (
        <span className="text-xs text-red-700">{state.message}</span>
      ) : null}
    </form>
  );
}

export function EmployeesTable({
  employees,
  canManage,
  onEditEmployee,
}: Readonly<{
  employees: Employee[];
  canManage: boolean;
  onEditEmployee: (employee: Employee) => void;
}>) {
  if (employees.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">
          Δεν υπάρχουν εργαζόμενοι ακόμα
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Προσθέστε εργαζόμενους ή συνεργάτες για να τους χρησιμοποιήσετε στα
          επόμενα modules.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3 font-semibold">Ονοματεπώνυμο</th>
              <th className="px-5 py-3 font-semibold">Τύπος</th>
              <th className="px-5 py-3 font-semibold">Ημερομίσθιο</th>
              <th className="px-5 py-3 font-semibold">Ωρομίσθιο</th>
              <th className="px-5 py-3 font-semibold">Υπερωρία</th>
              <th className="px-5 py-3 font-semibold">Κατάσταση</th>
              <th className="px-5 py-3 font-semibold">Σημειώσεις</th>
              <th className="px-5 py-3 font-semibold">Ενέργειες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="px-5 py-4 font-medium text-slate-950">
                  {employee.full_name}
                </td>
                <td className="px-5 py-4">
                  <EmployeeTypeBadge employeeType={employee.employee_type} />
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {formatRate(employee.daily_rate)}
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {formatRate(employee.hourly_rate)}
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {formatRate(employee.overtime_rate)}
                </td>
                <td className="px-5 py-4">
                  <EmployeeStatusBadge active={employee.active} />
                </td>
                <td className="max-w-xs truncate px-5 py-4 text-slate-700">
                  {employee.notes ?? "-"}
                </td>
                <td className="px-5 py-4">
                  {canManage ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEditEmployee(employee)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Επεξεργασία
                      </button>
                      <EmployeeActiveToggle employee={employee} />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Προβολή μόνο</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
