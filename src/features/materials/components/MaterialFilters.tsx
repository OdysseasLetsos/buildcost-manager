"use client";

import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";

export function MaterialFilters({
  monthId,
  projectId,
  supplierName,
  paymentStatus,
  search,
  monthlyPeriods,
  projects,
  onMonthChange,
  onProjectChange,
  onSupplierChange,
  onStatusChange,
  onSearchChange,
}: Readonly<{
  monthId: string;
  projectId: string;
  supplierName: string;
  paymentStatus: string;
  search: string;
  monthlyPeriods: MonthlyPeriod[];
  projects: Project[];
  onMonthChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onSupplierChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}>) {
  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Μήνας
        <select value={monthId} onChange={(event) => onMonthChange(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
          <option value="">Επιλέξτε μήνα</option>
          {monthlyPeriods.map((period) => (
            <option key={period.id} value={period.id}>{period.month_key}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Έργο
        <select value={projectId} onChange={(event) => onProjectChange(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
          <option value="">Όλα</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.code} - {project.name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Προμηθευτής
        <input value={supplierName} onChange={(event) => onSupplierChange(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Κατάσταση Πληρωμής
        <select value={paymentStatus} onChange={(event) => onStatusChange(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
          <option value="">Όλες</option>
          <option value="pending">Εκκρεμεί</option>
          <option value="paid">Πληρωμένο</option>
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Αναζήτηση
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>
    </section>
  );
}
