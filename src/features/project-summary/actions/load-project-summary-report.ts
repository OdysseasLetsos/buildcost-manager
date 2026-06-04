"use server";

import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";
import { PROJECT_SUMMARY_ALL_MONTHS_VALUE, type ProjectSummaryReport } from "../types";
import { aggregateProjectSummaryReports } from "../services/aggregate-project-summary-reports";
import { getProjectSummary } from "../services/get-project-summary";

export type LoadProjectSummaryReportResult =
  | { ok: true; report: ProjectSummaryReport }
  | { ok: false; message: string };

export async function loadProjectSummaryReport(
  monthId: string,
): Promise<LoadProjectSummaryReportResult> {
  try {
    const currentCompany = await getCurrentCompany();

    if (!currentCompany) {
      return { ok: false, message: "Δεν ήταν δυνατός ο υπολογισμός της σύνοψης." };
    }

    const companyId = currentCompany.company.id;
    await requireCompanyMember(companyId);
    await requireRole(companyId, ["owner", "admin", "office"]);

    const featureAvailable = await canUseFeature(companyId, "project_summary");

    if (!featureAvailable) {
      return { ok: false, message: "Δεν ήταν δυνατός ο υπολογισμός της σύνοψης." };
    }

    if (monthId === PROJECT_SUMMARY_ALL_MONTHS_VALUE) {
      const monthlyPeriods = await getMonthlyPeriods(companyId);
      const reports = await Promise.all(
        monthlyPeriods.map((period) => getProjectSummary(companyId, period.id)),
      );

      return { ok: true, report: aggregateProjectSummaryReports(reports) };
    }

    return { ok: true, report: await getProjectSummary(companyId, monthId) };
  } catch (error) {
    console.error("[project-summary:loadProjectSummaryReport] Error", error);
    return { ok: false, message: "Δεν ήταν δυνατός ο υπολογισμός της σύνοψης." };
  }
}
