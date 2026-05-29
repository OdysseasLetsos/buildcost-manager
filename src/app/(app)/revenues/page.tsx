import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany } from "@/src/core/tenants";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";
import { getProjects } from "@/src/features/projects/services/get-projects";
import { RevenuesPageClient } from "@/src/features/revenues/components/RevenuesPageClient";
import { getRevenues } from "@/src/features/revenues/services/get-revenues";

export default async function RevenuesPage() {
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;

  try {
    await requireRole(companyId, ["owner", "admin", "office"]);
  } catch {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          Δεν έχετε δικαίωμα πρόσβασης στα έσοδα.
        </h2>
      </section>
    );
  }

  const featureAvailable = await canUseFeature(companyId, "revenues");

  if (!featureAvailable) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-amber-950">
          Το τρέχον πακέτο της εταιρείας δεν περιλαμβάνει Έσοδα.
        </h2>
      </section>
    );
  }

  const monthlyPeriods = await getMonthlyPeriods(companyId);
  const latestOpenMonth = monthlyPeriods.find(
    (period) => period.status === "open" && !period.is_locked,
  );
  const defaultMonthId = latestOpenMonth?.id ?? monthlyPeriods[0]?.id ?? "";
  const [revenues, projects] = await Promise.all([
    getRevenues(companyId),
    getProjects(companyId),
  ]);

  return (
    <RevenuesPageClient
      revenues={revenues}
      monthlyPeriods={monthlyPeriods}
      projects={projects}
      defaultMonthId={defaultMonthId}
      canManage
      featureAvailable={featureAvailable}
    />
  );
}
