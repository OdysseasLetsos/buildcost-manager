"use client";

import type { Employee } from "@/src/features/employees/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import type { ReportType } from "../constants";
import { reportTypeLabels, reportTypes } from "../constants";

export function ReportsFilters({
  monthlyPeriods,
  projects,
  employees,
  reportType,
  monthId,
  projectId,
  employeeId,
  onReportTypeChange,
  onMonthChange,
  onProjectChange,
  onEmployeeChange,
}: {
  monthlyPeriods: MonthlyPeriod[];
  projects: Project[];
  employees: Employee[];
  reportType: ReportType;
  monthId: string;
  projectId: string;
  employeeId: string;
  onReportTypeChange: (value: ReportType) => void;
  onMonthChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onEmployeeChange: (value: string) => void;
}) {
  const showProjectFilter = ["monthly_project_summary", "materials", "revenues"].includes(
    reportType,
  );
  const showEmployeeFilter = reportType === "employee_work";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Αναφορά</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) => onReportTypeChange(event.target.value as ReportType)}
            value={reportType}
          >
            {reportTypes.map((type) => (
              <option key={type} value={type}>
                {reportTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Μήνας</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) => onMonthChange(event.target.value)}
            value={monthId}
          >
            {monthlyPeriods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.month_key}
              </option>
            ))}
          </select>
        </label>

        {showProjectFilter ? (
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Έργο</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              onChange={(event) => onProjectChange(event.target.value)}
              value={projectId}
            >
              <option value="">Όλα τα έργα</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {showEmployeeFilter ? (
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Εργαζόμενος</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              onChange={(event) => onEmployeeChange(event.target.value)}
              value={employeeId}
            >
              <option value="">Όλοι οι εργαζόμενοι</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </section>
  );
}
