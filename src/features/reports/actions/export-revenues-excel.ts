"use server";

import {
  auditReportExport,
  exportError,
  prepareReportExport,
} from "./export-shared";
import { getRevenuesReport } from "../services/get-revenues-report";
import {
  bufferToBase64,
  generateExcelBuffer,
} from "../services/generate-excel-buffer";
import type { ReportActionState, RevenuesReportRow } from "../types";

const columns = [
  { label: "Ημερομηνία", value: (row: RevenuesReportRow) => row.revenueDate },
  { label: "Έργο", value: (row: RevenuesReportRow) => row.projectLabel },
  { label: "Πελάτης", value: (row: RevenuesReportRow) => row.clientName },
  {
    label: "Αριθμός Τιμολογίου",
    value: (row: RevenuesReportRow) => row.invoiceNumber,
  },
  { label: "Τύπος", value: (row: RevenuesReportRow) => row.revenueType },
  { label: "Τιμολογηθέντα", value: (row: RevenuesReportRow) => row.invoicedAmount },
  { label: "Εισπραχθέντα", value: (row: RevenuesReportRow) => row.receivedAmount },
  { label: "Υπόλοιπο", value: (row: RevenuesReportRow) => row.remainingAmount },
  { label: "Κατάσταση", value: (row: RevenuesReportRow) => row.status },
];

export async function exportRevenuesExcel(
  _state: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  try {
    const context = await prepareReportExport(formData, "reports_excel");
    const rows = await getRevenuesReport({
      companyId: context.companyId,
      monthId: context.monthId,
      projectId: context.projectId,
    });
    await auditReportExport({ context, reportType: "revenues", exportType: "excel" });
    const buffer = generateExcelBuffer({ columns, rows });

    return {
      ok: true,
      fileName: `revenues-${context.monthKey}.csv`,
      mimeType: "text/csv;charset=utf-8",
      base64: bufferToBase64(buffer),
      message: "Η εξαγωγή Excel δημιουργήθηκε.",
    };
  } catch (error) {
    return exportError(error);
  }
}
