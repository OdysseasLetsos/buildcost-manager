import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany } from "@/src/core/tenants";
import { getMaterials } from "@/src/features/materials/services/get-materials";
import { MaterialsPageClient } from "@/src/features/materials/components/MaterialsPageClient";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";
import { getProjects } from "@/src/features/projects/services/get-projects";

export default async function MaterialsPage() {
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;
  const [materials, monthlyPeriods, projects, featureAvailable] = await Promise.all([
    getMaterials(companyId),
    getMonthlyPeriods(companyId),
    getProjects(companyId),
    canUseFeature(companyId, "materials"),
  ]);

  let canManage = false;

  try {
    await requireRole(companyId, ["owner", "admin", "office", "foreman"]);
    canManage = true;
  } catch {
    canManage = false;
  }

  const latestOpenMonth = monthlyPeriods.find(
    (period) => period.status === "open" && !period.is_locked,
  );

  return (
    <MaterialsPageClient
      materials={materials}
      monthlyPeriods={monthlyPeriods}
      projects={projects}
      canManage={canManage}
      featureAvailable={featureAvailable}
      defaultMonthId={latestOpenMonth?.id ?? monthlyPeriods[0]?.id ?? ""}
    />
  );
}
