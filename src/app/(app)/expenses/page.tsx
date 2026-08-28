import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany } from "@/src/core/tenants";
import { ExpensesPageClient } from "@/src/features/expenses/components/ExpensesPageClient";
import { getExpenseAllocationPreview } from "@/src/features/expenses/services/get-expense-allocation-preview";
import { getCompanyOffices } from "@/src/features/expenses/services/get-company-offices";
import { getCompanyVehicles } from "@/src/features/expenses/services/get-company-vehicles";
import { getExpenses } from "@/src/features/expenses/services/get-expenses";
import { getMaterials } from "@/src/features/materials/services/get-materials";
import { getSuppliers } from "@/src/features/materials/services/get-suppliers";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";
import { getProjects } from "@/src/features/projects/services/get-projects";

type ExpensesPageProps = {
  searchParams?: Promise<{ section?: string }>;
};

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;
  let canAccessExpenses = false;
  let canAccessMaterials = false;
  let canAccessAiInvoices = false;

  try {
    await requireRole(companyId, ["owner", "admin", "office"]);
    canAccessExpenses = true;
  } catch {
    canAccessExpenses = false;
  }

  try {
    await requireRole(companyId, ["owner", "admin", "office", "foreman"]);
    canAccessMaterials = true;
  } catch {
    canAccessMaterials = false;
  }

  try {
    await requireRole(companyId, ["owner", "admin", "office"]);
    canAccessAiInvoices = true;
  } catch {
    canAccessAiInvoices = false;
  }

  if (!canAccessExpenses && !canAccessMaterials) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          Δεν έχετε δικαίωμα πρόσβασης στα έξοδα.
        </h2>
      </section>
    );
  }

  const [
    expensesFeatureAvailable,
    materialsFeatureAvailable,
    aiInvoicesFeatureAvailable,
    monthlyPeriods,
  ] = await Promise.all([
    canUseFeature(companyId, "expenses"),
    canUseFeature(companyId, "materials"),
    canAccessAiInvoices
      ? canUseFeature(companyId, "ai_invoice_import")
      : Promise.resolve(false),
    getMonthlyPeriods(companyId),
  ]);

  if (
    (!canAccessExpenses || !expensesFeatureAvailable) &&
    (!canAccessMaterials || !materialsFeatureAvailable)
  ) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-amber-950">
          Το τρέχον πακέτο της εταιρείας δεν περιλαμβάνει Έξοδα ή Υλικά.
        </h2>
      </section>
    );
  }

  const latestOpenMonth = monthlyPeriods.find(
    (period) => period.status === "open" && !period.is_locked,
  );
  const defaultMonthId = latestOpenMonth?.id ?? monthlyPeriods[0]?.id ?? "";
  const shouldLoadExpenses = canAccessExpenses && expensesFeatureAvailable;
  const shouldLoadMaterials = canAccessMaterials && materialsFeatureAvailable;
  const [
    expenses,
    offices,
    vehicles,
    allocationEntries,
    materials,
    suppliers,
    projects,
  ] = await Promise.all([
    shouldLoadExpenses ? getExpenses(companyId) : Promise.resolve([]),
    shouldLoadExpenses ? getCompanyOffices(companyId) : Promise.resolve([]),
    shouldLoadExpenses ? getCompanyVehicles(companyId) : Promise.resolve([]),
    shouldLoadExpenses
      ? Promise.all(
          monthlyPeriods.map(
            async (period) =>
              [
                period.id,
                await getExpenseAllocationPreview(companyId, period.id),
              ] as const,
          ),
        )
      : Promise.resolve([]),
    shouldLoadMaterials ? getMaterials(companyId) : Promise.resolve([]),
    shouldLoadMaterials ? getSuppliers(companyId) : Promise.resolve([]),
    shouldLoadMaterials ? getProjects(companyId) : Promise.resolve([]),
  ]);
  const resolvedSearchParams = await searchParams;
  const initialSection =
    resolvedSearchParams?.section === "materials" ? "materials" : undefined;

  return (
    <ExpensesPageClient
      expenses={expenses}
      offices={offices}
      vehicles={vehicles}
      materials={materials}
      suppliers={suppliers}
      projects={projects}
      monthlyPeriods={monthlyPeriods}
      defaultMonthId={defaultMonthId}
      canManageExpenses={canAccessExpenses}
      canManageMaterials={canAccessMaterials}
      canUseAiInvoicesRole={canAccessAiInvoices}
      aiInvoicesFeatureAvailable={aiInvoicesFeatureAvailable}
      expensesFeatureAvailable={expensesFeatureAvailable}
      materialsFeatureAvailable={materialsFeatureAvailable}
      allocationPreview={Object.fromEntries(allocationEntries)}
      initialSection={initialSection}
    />
  );
}
