"use server";

import {
  auditReportExport,
  exportError,
  prepareReportExport,
} from "./export-shared";
import { projectSummaryStatusLabels } from "../constants";
import { getMonthlyProjectSummaryReport } from "../services/get-monthly-project-summary-report";
import {
  bufferToBase64,
  generateExcelBuffer,
} from "../services/generate-excel-buffer";
import type { ReportActionState } from "../types";
import type { ProjectSummaryRow } from "@/src/features/project-summary/types";

const columns = [
  { label: "Έργο", value: (row: ProjectSummaryRow) => `${row.projectCode} - ${row.projectName}` },
  { label: "Ώρες", value: (row: ProjectSummaryRow) => row.hours },
  { label: "Υπερωρίες", value: (row: ProjectSummaryRow) => row.overtimeHours },
  { label: "Πληρωμές", value: (row: ProjectSummaryRow) => row.costs.allocatedPayments },
  { label: "ΙΚΑ", value: (row: ProjectSummaryRow) => row.costs.allocatedIka },
  { label: "Υλικά", value: (row: ProjectSummaryRow) => row.costs.materialsCost },
  { label: "Έξοδα", value: (row: ProjectSummaryRow) => row.costs.allocatedExpenses },
  { label: "Συνολικό Κόστος", value: (row: ProjectSummaryRow) => row.totalCost },
  { label: "Έσοδα", value: (row: ProjectSummaryRow) => row.invoicedRevenue },
  { label: "Εισπραχθέντα", value: (row: ProjectSummaryRow) => row.receivedRevenue },
  { label: "Υπόλοιπο", value: (row: ProjectSummaryRow) => row.remainingRevenue },
  { label: "Κέρδος", value: (row: ProjectSummaryRow) => row.profit },
  {
    label: "Περιθώριο",
    value: (row: ProjectSummaryRow) =>
      row.margin === null ? "" : `${(row.margin * 100).toFixed(2)}%`,
  },
  {
    label: "Κατάσταση",
    value: (row: ProjectSummaryRow) => projectSummaryStatusLabels[row.status],
  },
];

export async function exportMonthlyProjectSummaryExcel(
  _state: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  try {
    const context = await prepareReportExport(formData, "reports_excel");
    const report = await getMonthlyProjectSummaryReport({
      companyId: context.companyId,
      monthId: context.monthId,
      projectId: context.projectId,
    });
    await auditReportExport({
      context,
      reportType: "monthly_project_summary",
      exportType: "excel",
    });
    const buffer = generateExcelBuffer({ columns, rows: report.projects });

    return {
      ok: true,
      fileName: `monthly-project-summary-${context.monthKey}.csv`,
      mimeType: "text/csv;charset=utf-8",
      base64: bufferToBase64(buffer),
      message: "Η εξαγωγή Excel δημιουργήθηκε.",
    };
  } catch (error) {
    return exportError(error);
  }
}
