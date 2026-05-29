"use server";

import {
  auditReportExport,
  exportError,
  prepareReportExport,
} from "./export-shared";
import { getExpensesReport } from "../services/get-expenses-report";
import {
  bufferToBase64,
  generateExcelBuffer,
} from "../services/generate-excel-buffer";
import type { ExpensesReportRow, ReportActionState } from "../types";

const columns = [
  { label: "Ημερομηνία", value: (row: ExpensesReportRow) => row.expenseDate },
  { label: "Τύπος", value: (row: ExpensesReportRow) => row.scope },
  { label: "Κατηγορία", value: (row: ExpensesReportRow) => row.category },
  { label: "Περιγραφή", value: (row: ExpensesReportRow) => row.description },
  { label: "Ποσό", value: (row: ExpensesReportRow) => row.amount },
  {
    label: "Μέθοδος Κατανομής",
    value: (row: ExpensesReportRow) => row.allocationMethod,
  },
];

export async function exportExpensesExcel(
  _state: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  try {
    const context = await prepareReportExport(formData, "reports_excel");
    const rows = await getExpensesReport({
      companyId: context.companyId,
      monthId: context.monthId,
    });
    await auditReportExport({ context, reportType: "expenses", exportType: "excel" });
    const buffer = generateExcelBuffer({ columns, rows });

    return {
      ok: true,
      fileName: `expenses-${context.monthKey}.csv`,
      mimeType: "text/csv;charset=utf-8",
      base64: bufferToBase64(buffer),
      message: "Η εξαγωγή Excel δημιουργήθηκε.",
    };
  } catch (error) {
    return exportError(error);
  }
}
