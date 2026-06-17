"use server";

import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";
import type { ProjectSummaryReport } from "../types";
import { getAllMonthsProjectSummary } from "../services/get-all-months-project-summary";
import { getProjectSummary } from "../services/get-project-summary";

type LoadProjectSummaryResult =
  | { report: ProjectSummaryReport; error?: never }
  | { report?: never; error: string };

const genericError = "Δεν ήταν δυνατός ο υπολογισμός της σύνοψης.";

export async function loadProjectSummaryReport(
  selectedMonthId: string,
): Promise<LoadProjectSummaryResult> {
  try {
    const currentCompany = await getCurrentCompany();

    if (!currentCompany) {
      return { error: genericError };
    }

    const companyId = currentCompany.company.id;
    await requireCompanyMember(companyId);
    await requireRole(companyId, ["owner", "admin", "office"]);

    const featureAvailable = await canUseFeature(companyId, "project_summary");

    if (!featureAvailable) {
      return { error: genericError };
    }

    const monthlyPeriods = await getMonthlyPeriods(companyId);

    if (selectedMonthId === "all") {
      return {
        report: await getAllMonthsProjectSummary(companyId, monthlyPeriods),
      };
    }

    const monthExists = monthlyPeriods.some((period) => period.id === selectedMonthId);

    if (!monthExists) {
      return { error: genericError };
    }

    return { report: await getProjectSummary(companyId, selectedMonthId) };
  } catch (error) {
    console.error("[project-summary:load-report] Error", error);
    return { error: genericError };
  }
}
