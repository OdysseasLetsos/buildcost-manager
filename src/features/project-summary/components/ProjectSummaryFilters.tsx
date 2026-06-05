"use client";

import { useTranslation } from "@/src/shared/i18n";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { ProjectSummaryRow } from "../types";
import { PROJECT_SUMMARY_ALL_MONTHS_VALUE } from "../types";

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
  const { t } = useTranslation();
  const canUseAllMonths = monthlyPeriods.length >= 2;

  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        {t("projectSummary.month")}
        <select
          value={monthId}
          onChange={(event) => onMonthChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          {monthlyPeriods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.month_key}
            </option>
          ))}
          {canUseAllMonths ? (
            <option value={PROJECT_SUMMARY_ALL_MONTHS_VALUE}>
              {t("projectSummary.allMonths")}
            </option>
          ) : null}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        {t("projectSummary.project")}
        <select
          value={projectId}
          onChange={(event) => onProjectChange(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">{t("projectSummary.allProjects")}</option>
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
