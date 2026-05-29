"use client";

import { useMemo, useState } from "react";
import type { Employee } from "@/src/features/employees/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import type { ProjectSummaryReport } from "@/src/features/project-summary/types";
import type { ReportType } from "../constants";
import { reportTypeLabels } from "../constants";
import type { ReportsByMonth } from "../types";
import { EmployeeWorkReport } from "./EmployeeWorkReport";
import { ExpensesReport } from "./ExpensesReport";
import { MaterialsReport } from "./MaterialsReport";
import { MonthlyProjectSummaryReport } from "./MonthlyProjectSummaryReport";
import { ReportsFilters } from "./ReportsFilters";
import { ReportsList } from "./ReportsList";
import { RevenuesReport } from "./RevenuesReport";

function filterSummaryReport(
  report: ProjectSummaryReport,
  projectId: string,
): ProjectSummaryReport {
  if (!projectId) return report;

  return {
    ...report,
    projects: report.projects.filter((project) => project.projectId === projectId),
  };
}

export function ReportsPageClient({
  monthlyPeriods,
  projects,
  employees,
  defaultMonthId,
  reportsByMonth,
  excelAvailable,
  pdfAvailable,
}: {
  monthlyPeriods: MonthlyPeriod[];
  projects: Project[];
  employees: Employee[];
  defaultMonthId: string;
  reportsByMonth: ReportsByMonth;
  excelAvailable: boolean;
  pdfAvailable: boolean;
}) {
  const [reportType, setReportType] =
    useState<ReportType>("monthly_project_summary");
  const [monthId, setMonthId] = useState(defaultMonthId);
  const [projectId, setProjectId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const currentReports = reportsByMonth[monthId];

  const filteredReport = useMemo(() => {
    if (!currentReports) return null;

    return {
      monthlyProjectSummary: filterSummaryReport(
        currentReports.monthlyProjectSummary,
        projectId,
      ),
      employeeWork: currentReports.employeeWork.filter(
        (row) => !employeeId || row.employeeId === employeeId,
      ),
      materials: currentReports.materials.filter(
        (row) => !projectId || row.projectId === projectId,
      ),
      expenses: currentReports.expenses,
      revenues: currentReports.revenues.filter(
        (row) => !projectId || row.projectId === projectId,
      ),
    };
  }, [currentReports, employeeId, projectId]);

  function handleReportTypeChange(nextReportType: ReportType) {
    setReportType(nextReportType);
    setProjectId("");
    setEmployeeId("");
  }

  function renderReportPreview() {
    if (!filteredReport) {
      return (
        <p className="p-6 text-sm text-slate-600">
          Δημιουργήστε έναν μήνα για να εμφανιστούν αναφορές.
        </p>
      );
    }

    if (reportType === "monthly_project_summary") {
      return <MonthlyProjectSummaryReport report={filteredReport.monthlyProjectSummary} />;
    }

    if (reportType === "employee_work") {
      return <EmployeeWorkReport rows={filteredReport.employeeWork} />;
    }

    if (reportType === "materials") {
      return <MaterialsReport rows={filteredReport.materials} />;
    }

    if (reportType === "expenses") {
      return <ExpensesReport rows={filteredReport.expenses} />;
    }

    return <RevenuesReport rows={filteredReport.revenues} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Αναφορές</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Συγκεντρωτικές αναφορές και εξαγωγές για έργα, εργαζόμενους, υλικά,
          έξοδα και έσοδα.
        </p>
      </header>

      <ReportsList
        employeeId={employeeId}
        excelAvailable={excelAvailable}
        monthId={monthId}
        onSelectReportType={handleReportTypeChange}
        pdfAvailable={pdfAvailable}
        projectId={projectId}
        selectedReportType={reportType}
      />

      <ReportsFilters
        employeeId={employeeId}
        employees={employees}
        monthId={monthId}
        monthlyPeriods={monthlyPeriods}
        onEmployeeChange={setEmployeeId}
        onMonthChange={setMonthId}
        onProjectChange={setProjectId}
        onReportTypeChange={handleReportTypeChange}
        projectId={projectId}
        projects={projects}
        reportType={reportType}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {reportTypeLabels[reportType]}
            </h2>
            <p className="text-sm text-slate-500">
              Η προεπισκόπηση χρησιμοποιεί τα ίδια δεδομένα με την εξαγωγή.
            </p>
          </div>
        </div>
        {renderReportPreview()}
      </section>
    </div>
  );
}
