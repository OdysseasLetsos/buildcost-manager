"use client";

import { useActionState, useEffect } from "react";
import type { ReportActionState } from "../types";
import type { ReportType } from "../constants";
import { initialReportActionState } from "../types";
import { exportEmployeeWorkExcel } from "../actions/export-employee-work-excel";
import { exportExpensesExcel } from "../actions/export-expenses-excel";
import { exportMaterialsExcel } from "../actions/export-materials-excel";
import { exportMonthlyProjectSummaryExcel } from "../actions/export-monthly-project-summary-excel";
import { exportMonthlyProjectSummaryPdf } from "../actions/export-monthly-project-summary-pdf";
import { exportRevenuesExcel } from "../actions/export-revenues-excel";

type ExportAction = (
  state: ReportActionState,
  formData: FormData,
) => Promise<ReportActionState>;

const excelActions: Record<ReportType, ExportAction> = {
  monthly_project_summary: exportMonthlyProjectSummaryExcel,
  employee_work: exportEmployeeWorkExcel,
  materials: exportMaterialsExcel,
  expenses: exportExpensesExcel,
  revenues: exportRevenuesExcel,
};

function downloadBase64File(state: ReportActionState): void {
  if (!state.ok || !state.base64 || !state.fileName || !state.mimeType) return;

  const binary = window.atob(state.base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: state.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = state.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ExportButtons({
  reportType,
  monthId,
  projectId,
  employeeId,
  excelAvailable,
  pdfAvailable,
}: {
  reportType: ReportType;
  monthId: string;
  projectId?: string;
  employeeId?: string;
  excelAvailable: boolean;
  pdfAvailable: boolean;
}) {
  const [excelState, excelAction, isExcelPending] = useActionState(
    excelActions[reportType],
    initialReportActionState,
  );
  const [pdfState, pdfAction, isPdfPending] = useActionState(
    exportMonthlyProjectSummaryPdf,
    initialReportActionState,
  );
  const canExport = Boolean(monthId);
  const pdfApplies = reportType === "monthly_project_summary";

  useEffect(() => {
    downloadBase64File(excelState);
  }, [excelState]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={excelAction}>
          <input name="monthId" type="hidden" value={monthId} />
          <input name="projectId" type="hidden" value={projectId ?? ""} />
          <input name="employeeId" type="hidden" value={employeeId ?? ""} />
          <button
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!excelAvailable || !canExport || isExcelPending}
            type="submit"
          >
            {isExcelPending ? "Εξαγωγή..." : "Εξαγωγή Excel"}
          </button>
        </form>

        {pdfApplies ? (
          <form action={pdfAction}>
            <input name="monthId" type="hidden" value={monthId} />
            <input name="projectId" type="hidden" value={projectId ?? ""} />
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              disabled={!pdfAvailable || !canExport || isPdfPending}
              type="submit"
            >
              {isPdfPending ? "Εξαγωγή..." : "Εξαγωγή PDF"}
            </button>
          </form>
        ) : null}
      </div>

      {!excelAvailable ? (
        <p className="text-xs text-amber-700">
          Η εξαγωγή Excel δεν είναι διαθέσιμη στο τρέχον πακέτο.
        </p>
      ) : null}
      {pdfApplies && !pdfAvailable ? (
        <p className="text-xs text-amber-700">
          Η εξαγωγή PDF δεν είναι διαθέσιμη στο τρέχον πακέτο.
        </p>
      ) : null}
      {excelState.message ? (
        <p className="text-xs text-slate-600">{excelState.message}</p>
      ) : null}
      {pdfState.message ? <p className="text-xs text-slate-600">{pdfState.message}</p> : null}
    </div>
  );
}
