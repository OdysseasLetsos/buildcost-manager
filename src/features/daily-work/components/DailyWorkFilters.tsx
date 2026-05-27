"use client";

import type { Employee } from "@/src/features/employees/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";

export function DailyWorkFilters({
  monthId,
  workDate,
  employeeId,
  projectId,
  monthlyPeriods,
  employees,
  projects,
  onMonthChange,
  onWorkDateChange,
  onEmployeeChange,
  onProjectChange,
}: Readonly<{
  monthId: string;
  workDate: string;
  employeeId: string;
  projectId: string;
  monthlyPeriods: MonthlyPeriod[];
  employees: Employee[];
  projects: Project[];
  onMonthChange: (value: string) => void;
  onWorkDateChange: (value: string) => void;
  onEmployeeChange: (value: string) => void;
  onProjectChange: (value: string) => void;
}>) {
  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Μήνας
        <select
          value={monthId}
          onChange={(event) => onMonthChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Όλοι</option>
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
          type="date"
          value={workDate}
          onChange={(event) => onWorkDateChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Εργαζόμενος
        <select
          value={employeeId}
          onChange={(event) => onEmployeeChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Όλοι</option>
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
          value={projectId}
          onChange={(event) => onProjectChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Όλα</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} - {project.name}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
