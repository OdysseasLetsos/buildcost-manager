"use server";

import {
  auditReportExport,
  exportError,
  prepareReportExport,
} from "./export-shared";
import { getMaterialsReport } from "../services/get-materials-report";
import {
  bufferToBase64,
  generateExcelBuffer,
} from "../services/generate-excel-buffer";
import type { MaterialsReportRow, ReportActionState } from "../types";

const columns = [
  { label: "Ημερομηνία", value: (row: MaterialsReportRow) => row.invoiceDate },
  { label: "Έργο", value: (row: MaterialsReportRow) => row.projectLabel },
  { label: "Προμηθευτής", value: (row: MaterialsReportRow) => row.supplierName },
  { label: "ΑΦΜ Προμηθευτή", value: (row: MaterialsReportRow) => row.supplierVat },
  {
    label: "Αριθμός Τιμολογίου",
    value: (row: MaterialsReportRow) => row.invoiceNumber,
  },
  { label: "Περιγραφή", value: (row: MaterialsReportRow) => row.description },
  { label: "Καθαρή Αξία", value: (row: MaterialsReportRow) => row.netAmount },
  { label: "ΦΠΑ", value: (row: MaterialsReportRow) => row.vatAmount },
  { label: "Σύνολο", value: (row: MaterialsReportRow) => row.totalAmount },
  {
    label: "Κατάσταση Πληρωμής",
    value: (row: MaterialsReportRow) => row.paymentStatus,
  },
];

export async function exportMaterialsExcel(
  _state: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  try {
    const context = await prepareReportExport(formData, "reports_excel");
    const rows = await getMaterialsReport({
      companyId: context.companyId,
      monthId: context.monthId,
      projectId: context.projectId,
    });
    await auditReportExport({ context, reportType: "materials", exportType: "excel" });
    const buffer = generateExcelBuffer({ columns, rows });

    return {
      ok: true,
      fileName: `materials-${context.monthKey}.csv`,
      mimeType: "text/csv;charset=utf-8",
      base64: bufferToBase64(buffer),
      message: "Η εξαγωγή Excel δημιουργήθηκε.",
    };
  } catch (error) {
    return exportError(error);
  }
}
