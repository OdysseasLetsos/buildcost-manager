import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";
import { ProjectSummaryPageClient } from "@/src/features/project-summary/components/ProjectSummaryPageClient";
import { getEmptyProjectSummaryReport } from "@/src/features/project-summary/services/aggregate-project-summary-reports";
import { getProjectSummary } from "@/src/features/project-summary/services/get-project-summary";

export default async function ProjectSummaryPage() {
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);

  try {
    await requireRole(companyId, ["owner", "admin", "office"]);
  } catch {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          Δεν έχετε δικαίωμα πρόσβασης στη σύνοψη έργου.
        </h2>
      </section>
    );
  }

  const featureAvailable = await canUseFeature(companyId, "project_summary");

  if (!featureAvailable) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-amber-950">
          Το τρέχον πακέτο της εταιρείας δεν περιλαμβάνει Σύνοψη Έργου.
        </h2>
      </section>
    );
  }

  const monthlyPeriods = await getMonthlyPeriods(companyId);
  const latestOpenMonth = monthlyPeriods.find(
    (period) => period.status === "open" && !period.is_locked,
  );
  const defaultMonthId = latestOpenMonth?.id ?? monthlyPeriods[0]?.id ?? "";
  const defaultReport = defaultMonthId
    ? await getProjectSummary(companyId, defaultMonthId)
    : getEmptyProjectSummaryReport();

  return (
    <ProjectSummaryPageClient
      monthlyPeriods={monthlyPeriods}
      defaultMonthId={defaultMonthId}
      defaultReport={defaultReport}
    />
  );
}
