import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany } from "@/src/core/tenants";
import { MonthlyPeriodsPageClient } from "@/src/features/monthly-periods/components/MonthlyPeriodsPageClient";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";

export default async function MonthsPage() {
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;
  const [monthlyPeriods, featureAvailable] = await Promise.all([
    getMonthlyPeriods(companyId),
    canUseFeature(companyId, "monthly_periods"),
  ]);

  let canCreate = false;
  let canManageLocks = false;

  try {
    await requireRole(companyId, ["owner", "admin", "office"]);
    canCreate = true;
  } catch {
    canCreate = false;
  }

  try {
    await requireRole(companyId, ["owner", "admin"]);
    canManageLocks = true;
  } catch {
    canManageLocks = false;
  }

  return (
    <MonthlyPeriodsPageClient
      monthlyPeriods={monthlyPeriods}
      canCreate={canCreate}
      canManageLocks={canManageLocks}
      featureAvailable={featureAvailable}
    />
  );
}
