"use server";

import {
  auditReportExport,
  exportError,
  prepareReportExport,
} from "./export-shared";
import { generatePdfBuffer } from "../services/generate-pdf-buffer";
import type { ReportActionState } from "../types";

export async function exportMonthlyProjectSummaryPdf(
  _state: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  try {
    const context = await prepareReportExport(formData, "reports_pdf");
    await auditReportExport({
      context,
      reportType: "monthly_project_summary",
      exportType: "pdf",
    });
    generatePdfBuffer({
      title: "Μηνιαία Σύνοψη Έργων",
      monthLabel: context.monthKey,
      companyName: context.companyName,
    });

    return {
      ok: false,
      message: "Η εξαγωγή PDF θα ενεργοποιηθεί σε επόμενη έκδοση.",
    };
  } catch (error) {
    return exportError(error);
  }
}
