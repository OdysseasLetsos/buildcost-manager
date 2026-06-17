"use client";

import { useMemo, useState } from "react";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { ProjectSummaryReport, ProjectSummaryTotals } from "../types";
import { loadProjectSummaryReport } from "../actions/load-project-summary-report";
import {
  addCostBreakdown,
  calculateTotalCost,
  emptyCostBreakdown,
} from "../services/calculate-cost-breakdown";
import { getProjectSummaryByProject } from "../services/get-project-summary-by-project";
import { LowMarginAlerts } from "./LowMarginAlerts";
import { ProjectComparisonTable } from "./ProjectComparisonTable";
import { ProjectCostBreakdown } from "./ProjectCostBreakdown";
import { ProjectCostChart } from "./ProjectCostChart";
import { ProjectSummaryFilters } from "./ProjectSummaryFilters";
import { ProjectSummaryKpiCards } from "./ProjectSummaryKpiCards";

function totalsForProjects(projects: ProjectSummaryReport["projects"]): ProjectSummaryTotals {
  const totals = projects.reduce<ProjectSummaryTotals>(
    (summary, project) => ({
      invoicedRevenue: summary.invoicedRevenue + project.invoicedRevenue,
      receivedRevenue: summary.receivedRevenue + project.receivedRevenue,
      remainingRevenue: summary.remainingRevenue + project.remainingRevenue,
      totalCost: summary.totalCost + project.totalCost,
      profit: summary.profit + project.profit,
      margin: null,
      costs: addCostBreakdown(summary.costs, project.costs),
    }),
    {
      invoicedRevenue: 0,
      receivedRevenue: 0,
      remainingRevenue: 0,
      totalCost: 0,
      profit: 0,
      margin: null,
      costs: emptyCostBreakdown(),
    },
  );
  totals.margin = totals.invoicedRevenue > 0 ? totals.profit / totals.invoicedRevenue : null;
  totals.totalCost = calculateTotalCost(totals.costs);
  totals.profit = totals.invoicedRevenue - totals.totalCost;
  return totals;
}

function emptyReport(monthId: string): ProjectSummaryReport {
  return {
    monthId,
    projects: [],
    totals: totalsForProjects([]),
    warnings: [],
  };
}

export function ProjectSummaryPageClient({
  monthlyPeriods,
  defaultMonthId,
  reportsByMonth,
}: Readonly<{
  monthlyPeriods: MonthlyPeriod[];
  defaultMonthId: string;
  reportsByMonth: Record<string, ProjectSummaryReport>;
}>) {
  const [monthId, setMonthId] = useState(defaultMonthId);
  const [projectId, setProjectId] = useState("");
  const [reportCache, setReportCache] = useState(reportsByMonth);
  const [loadingMonthId, setLoadingMonthId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const effectiveMonthId = monthId || defaultMonthId;
  const report = reportCache[effectiveMonthId] ?? emptyReport(effectiveMonthId);
  const isLoading = loadingMonthId === effectiveMonthId;
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
  const totals = selectedProject ? totalsForProjects([selectedProject]) : report.totals;
  const breakdownCosts = selectedProject ? selectedProject.costs : totals.costs;

  async function handleMonthChange(value: string) {
    setMonthId(value);
    setProjectId("");
    setErrorMessage("");

    if (!value || reportCache[value]) {
      return;
    }

    setLoadingMonthId(value);
    const result = await loadProjectSummaryReport(value);

    if (result.report) {
      setReportCache((currentReports) => ({
        ...currentReports,
        [value]: result.report,
      }));
    } else {
      setErrorMessage(result.error);
    }

    setLoadingMonthId((currentValue) =>
      currentValue === value ? null : currentValue,
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Σύνοψη Έργου</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Συγκεντρωτική εικόνα κόστους, εσόδων και κερδοφορίας ανά έργο.
        </p>
      </section>

      <ProjectSummaryFilters
        monthId={monthId}
        projectId={projectId}
        monthlyPeriods={monthlyPeriods}
        projects={report.projects}
        onMonthChange={(value) => void handleMonthChange(value)}
        onProjectChange={setProjectId}
      />

      {isLoading ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-800">
          Υπολογισμός σύνοψης...
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {errorMessage}
        </div>
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
