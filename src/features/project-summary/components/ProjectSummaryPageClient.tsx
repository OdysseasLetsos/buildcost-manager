"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslation } from "@/src/shared/i18n";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import { loadProjectSummaryReport } from "../actions/load-project-summary-report";
import type { ProjectSummaryReport } from "../types";
import { getProjectSummaryByProject } from "../services/get-project-summary-by-project";
import { getProjectSummaryTotals } from "../services/aggregate-project-summary-reports";
import { LowMarginAlerts } from "./LowMarginAlerts";
import { ProjectComparisonTable } from "./ProjectComparisonTable";
import { ProjectCostBreakdown } from "./ProjectCostBreakdown";
import { ProjectCostChart } from "./ProjectCostChart";
import { ProjectSummaryFilters } from "./ProjectSummaryFilters";
import { ProjectSummaryKpiCards } from "./ProjectSummaryKpiCards";

export function ProjectSummaryPageClient({
  monthlyPeriods,
  defaultMonthId,
  defaultReport,
}: Readonly<{
  monthlyPeriods: MonthlyPeriod[];
  defaultMonthId: string;
  defaultReport: ProjectSummaryReport;
}>) {
  const { t } = useTranslation();
  const [monthId, setMonthId] = useState(defaultMonthId);
  const [projectId, setProjectId] = useState("");
  const [reportsBySelection, setReportsBySelection] = useState<
    Record<string, ProjectSummaryReport>
  >({
    [defaultMonthId]: defaultReport,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const report = reportsBySelection[monthId] ?? defaultReport;
  const visibleProjects = useMemo(
    () =>
      projectId
        ? report.projects.filter((project) => project.projectId === projectId)
        : report.projects,
    [projectId, report.projects],
  );
  const selectedProject = projectId
    ? getProjectSummaryByProject(report, projectId)
    : null;
  const totals = selectedProject
    ? getProjectSummaryTotals([selectedProject])
    : report.totals;
  const breakdownCosts = selectedProject ? selectedProject.costs : totals.costs;

  function handleMonthChange(nextMonthId: string) {
    setMonthId(nextMonthId);
    setProjectId("");
    setErrorMessage(null);

    if (reportsBySelection[nextMonthId]) {
      return;
    }

    startTransition(async () => {
      const result = await loadProjectSummaryReport(nextMonthId);

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      setReportsBySelection((currentReports) => ({
        ...currentReports,
        [nextMonthId]: result.report,
      }));
    });
  }

  return (
    <div className="min-w-0 space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          {t("projectSummary.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {t("projectSummary.subtitle")}
        </p>
      </section>

      <ProjectSummaryFilters
        monthId={monthId}
        projectId={projectId}
        monthlyPeriods={monthlyPeriods}
        projects={report.projects}
        onMonthChange={handleMonthChange}
        onProjectChange={setProjectId}
      />

      {isPending ? (
        <section className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-900 shadow-sm">
          Υπολογισμός σύνοψης...
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800 shadow-sm">
          {errorMessage}
        </section>
      ) : null}

      <ProjectSummaryKpiCards totals={totals} />
      <LowMarginAlerts projects={visibleProjects} warnings={report.warnings} />

      <div className="grid gap-6 xl:grid-cols-2">
        <ProjectCostBreakdown costs={breakdownCosts} />
        <ProjectCostChart costs={breakdownCosts} />
      </div>

      <ProjectComparisonTable projects={visibleProjects} />
    </div>
  );
}
