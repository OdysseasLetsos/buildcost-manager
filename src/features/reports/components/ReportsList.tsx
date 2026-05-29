"use client";

import type { ReportType } from "../constants";
import { reportTypes } from "../constants";
import { ReportCard } from "./ReportCard";

export function ReportsList({
  selectedReportType,
  monthId,
  projectId,
  employeeId,
  excelAvailable,
  pdfAvailable,
  onSelectReportType,
}: {
  selectedReportType: ReportType;
  monthId: string;
  projectId?: string;
  employeeId?: string;
  excelAvailable: boolean;
  pdfAvailable: boolean;
  onSelectReportType: (reportType: ReportType) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {reportTypes.map((reportType) => (
        <ReportCard
          employeeId={employeeId}
          excelAvailable={excelAvailable}
          key={reportType}
          monthId={monthId}
          onSelect={onSelectReportType}
          pdfAvailable={pdfAvailable}
          projectId={projectId}
          reportType={reportType}
          selected={selectedReportType === reportType}
        />
      ))}
    </div>
  );
}
