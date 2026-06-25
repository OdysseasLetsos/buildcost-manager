import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany } from "@/src/core/tenants";
import { EmployeesPageClient } from "@/src/features/employees/components/EmployeesPageClient";
import { getEmployeeProjectContracts } from "@/src/features/employees/services/get-employee-project-contracts";
import { getEmployeeProjectOptions } from "@/src/features/employees/services/get-employee-project-options";
import { getEmployees } from "@/src/features/employees/services/get-employees";

export default async function EmployeesPage() {
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;
  const [employees, projectContracts, projectOptions, featureAvailable] = await Promise.all([
    getEmployees(companyId),
    getEmployeeProjectContracts(companyId),
    getEmployeeProjectOptions(companyId),
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
      projectContracts={projectContracts}
      projectOptions={projectOptions}
      canManage={canManage}
      featureAvailable={featureAvailable}
    />
  );
}
