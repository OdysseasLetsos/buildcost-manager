"use client";

import type { Employee } from "@/src/features/employees/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";

export function PaymentFilters({
  monthId,
  employeeId,
  paymentMethod,
  monthlyPeriods,
  employees,
  onMonthChange,
  onEmployeeChange,
  onPaymentMethodChange,
}: Readonly<{
  monthId: string;
  employeeId: string;
  paymentMethod: string;
  monthlyPeriods: MonthlyPeriod[];
  employees: Employee[];
  onMonthChange: (value: string) => void;
  onEmployeeChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
}>) {
  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Μήνας
        <select value={monthId} onChange={(e) => onMonthChange(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
          <option value="">Επιλέξτε μήνα</option>
          {monthlyPeriods.map((period) => (
            <option key={period.id} value={period.id}>{period.month_key}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Εργαζόμενος
        <select value={employeeId} onChange={(e) => onEmployeeChange(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
          <option value="">Όλοι</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>{employee.full_name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Τρόπος Πληρωμής
        <select value={paymentMethod} onChange={(e) => onPaymentMethodChange(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
          <option value="">Όλοι</option>
          <option value="cash">Μετρητά</option>
          <option value="bank">Τράπεζα</option>
          <option value="other">Άλλο</option>
        </select>
      </label>
    </section>
  );
}
