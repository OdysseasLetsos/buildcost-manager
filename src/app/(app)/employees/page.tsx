import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany } from "@/src/core/tenants";
import { EmployeesPageClient } from "@/src/features/employees/components/EmployeesPageClient";
import { getEmployees } from "@/src/features/employees/services/get-employees";

export default async function EmployeesPage() {
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;
  const [employees, featureAvailable] = await Promise.all([
    getEmployees(companyId),
    canUseFeature(companyId, "employees"),
  ]);

  let canManage = false;

  try {
    await requireRole(companyId, ["owner", "admin", "office"]);
    canManage = true;
  } catch {
    canManage = false;
  }

  return (
    <EmployeesPageClient
      employees={employees}
      canManage={canManage}
      featureAvailable={featureAvailable}
    />
  );
}
