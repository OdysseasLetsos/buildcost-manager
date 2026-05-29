import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature, type FeatureCode } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { getMonthlyPeriodById } from "@/src/features/monthly-periods/services/get-monthly-period-by-id";
import type { ReportActionState } from "../types";
import type { ReportType } from "../constants";

export type ExportContext = {
  userId: string;
  companyId: string;
  companyName: string;
  monthId: string;
  monthKey: string;
  projectId?: string;
  employeeId?: string;
};

export function getOptionalFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export async function prepareReportExport(
  formData: FormData,
  featureCode: FeatureCode,
): Promise<ExportContext> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    throw new Error("Δεν βρέθηκε ενεργή εταιρεία.");
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, featureCode);

  const monthId = getOptionalFormValue(formData, "monthId");

  if (!monthId) {
    throw new Error("Επιλέξτε μήνα για την αναφορά.");
  }

  const month = await getMonthlyPeriodById(companyId, monthId);

  if (!month) {
    throw new Error("Ο μήνας δεν βρέθηκε για την εταιρεία.");
  }

  return {
    userId: user.id,
    companyId,
    companyName: currentCompany.company.name,
    monthId,
    monthKey: month.month_key,
    projectId: getOptionalFormValue(formData, "projectId"),
    employeeId: getOptionalFormValue(formData, "employeeId"),
  };
}

export async function auditReportExport({
  context,
  reportType,
  exportType,
}: {
  context: ExportContext;
  reportType: ReportType;
  exportType: "excel" | "pdf";
}): Promise<void> {
  await writeAuditLog({
    companyId: context.companyId,
    action: "report_exported",
    entityType: "report",
    entityId: context.monthId,
    metadata: {
      report_type: reportType,
      export_type: exportType,
      month_id: context.monthId,
      user_id: context.userId,
    },
  });
}

export function exportError(error: unknown): ReportActionState {
  console.error("[reports:export] Export failed", {
    message: error instanceof Error ? error.message : String(error),
  });

  return {
    ok: false,
    message:
      error instanceof Error
        ? error.message
        : "Δεν ήταν δυνατή η εξαγωγή της αναφοράς.",
  };
}
