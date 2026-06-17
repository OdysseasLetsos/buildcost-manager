"use client";

import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { ProjectSummaryRow } from "../types";

export function ProjectSummaryFilters({
  monthId,
  projectId,
  monthlyPeriods,
  projects,
  onMonthChange,
  onProjectChange,
}: Readonly<{
  monthId: string;
  projectId: string;
  monthlyPeriods: MonthlyPeriod[];
  projects: ProjectSummaryRow[];
  onMonthChange: (value: string) => void;
  onProjectChange: (value: string) => void;
}>) {
  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
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
          {monthlyPeriods.length >= 2 ? (
            <option value="all">Όλοι οι μήνες</option>
          ) : null}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Έργο
        <select
          value={projectId}
          onChange={(event) => onProjectChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">Όλα τα έργα</option>
          {projects.map((project) => (
            <option key={project.projectId} value={project.projectId}>
              {project.projectCode} - {project.projectName}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
