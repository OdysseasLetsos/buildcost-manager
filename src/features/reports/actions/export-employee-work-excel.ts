"use server";

import {
  auditReportExport,
  exportError,
  prepareReportExport,
} from "./export-shared";
import { getEmployeeWorkReport } from "../services/get-employee-work-report";
import {
  bufferToBase64,
  generateExcelBuffer,
} from "../services/generate-excel-buffer";
import type { EmployeeWorkReportRow, ReportActionState } from "../types";

const columns = [
  { label: "Εργαζόμενος", value: (row: EmployeeWorkReportRow) => row.employeeName },
  { label: "Σύνολο Ωρών", value: (row: EmployeeWorkReportRow) => row.totalHours },
  {
    label: "Σύνολο Υπερωριών",
    value: (row: EmployeeWorkReportRow) => row.totalOvertimeHours,
  },
  {
    label: "Έξοδα Εργαζομένου",
    value: (row: EmployeeWorkReportRow) => row.employeeExpenses,
  },
  { label: "Πληρωμές", value: (row: EmployeeWorkReportRow) => row.payments },
  { label: "ΙΚΑ", value: (row: EmployeeWorkReportRow) => row.ika },
  {
    label: "Έργα που δούλεψε",
    value: (row: EmployeeWorkReportRow) => row.projectLabels.join(", "),
  },
];

export async function exportEmployeeWorkExcel(
  _state: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  try {
    const context = await prepareReportExport(formData, "reports_excel");
    const rows = await getEmployeeWorkReport({
      companyId: context.companyId,
      monthId: context.monthId,
      employeeId: context.employeeId,
    });
    await auditReportExport({ context, reportType: "employee_work", exportType: "excel" });
    const buffer = generateExcelBuffer({ columns, rows });

    return {
      ok: true,
      fileName: `employee-work-${context.monthKey}.csv`,
      mimeType: "text/csv;charset=utf-8",
      base64: bufferToBase64(buffer),
      message: "Η εξαγωγή Excel δημιουργήθηκε.",
    };
  } catch (error) {
    return exportError(error);
  }
}
