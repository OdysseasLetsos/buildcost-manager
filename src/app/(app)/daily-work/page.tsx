import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany } from "@/src/core/tenants";
import { DailyWorkPageClient } from "@/src/features/daily-work/components/DailyWorkPageClient";
import { getDailyWorkEntries } from "@/src/features/daily-work/services/get-daily-work-entries";
import { getEmployees } from "@/src/features/employees/services/get-employees";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";
import { getProjects } from "@/src/features/projects/services/get-projects";

export default async function DailyWorkPage() {
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;
  const [entries, allEmployees, allProjects, monthlyPeriods, featureAvailable] =
    await Promise.all([
      getDailyWorkEntries(companyId),
      getEmployees(companyId),
      getProjects(companyId),
      getMonthlyPeriods(companyId),
      canUseFeature(companyId, "daily_work"),
    ]);

  let canManage = false;

  try {
    await requireRole(companyId, ["owner", "admin", "office", "foreman"]);
    canManage = true;
  } catch {
    canManage = false;
  }

  const activeEmployees = allEmployees.filter((employee) => employee.active);
  const activeProjects = allProjects.filter((project) => project.status !== "archived");
  const latestOpenMonth = monthlyPeriods.find(
    (period) => period.status === "open" && !period.is_locked,
  );

  return (
    <DailyWorkPageClient
      entries={entries}
      monthlyPeriods={monthlyPeriods}
      employees={activeEmployees}
      projects={activeProjects}
      canManage={canManage}
      featureAvailable={featureAvailable}
      defaultMonthId={latestOpenMonth?.id ?? monthlyPeriods[0]?.id ?? ""}
    />
  );
}
