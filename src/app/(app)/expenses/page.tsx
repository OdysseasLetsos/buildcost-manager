import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany } from "@/src/core/tenants";
import { ExpensesPageClient } from "@/src/features/expenses/components/ExpensesPageClient";
import { getExpenseAllocationPreview } from "@/src/features/expenses/services/get-expense-allocation-preview";
import { getExpenses } from "@/src/features/expenses/services/get-expenses";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";

export default async function ExpensesPage() {
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
          Δεν έχετε δικαίωμα πρόσβασης στα έξοδα.
        </h2>
      </section>
    );
  }

  const featureAvailable = await canUseFeature(companyId, "expenses");

  if (!featureAvailable) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-amber-950">
          Το τρέχον πακέτο της εταιρείας δεν περιλαμβάνει Έξοδα.
        </h2>
      </section>
    );
  }

  const monthlyPeriods = await getMonthlyPeriods(companyId);
  const latestOpenMonth = monthlyPeriods.find(
    (period) => period.status === "open" && !period.is_locked,
  );
  const defaultMonthId = latestOpenMonth?.id ?? monthlyPeriods[0]?.id ?? "";

  const [expenses, allocationEntries] = await Promise.all([
    getExpenses(companyId),
    Promise.all(
      monthlyPeriods.map(
        async (period) =>
          [
            period.id,
            await getExpenseAllocationPreview(companyId, period.id),
          ] as const,
      ),
    ),
  ]);

  return (
    <ExpensesPageClient
      expenses={expenses}
      monthlyPeriods={monthlyPeriods}
      defaultMonthId={defaultMonthId}
      canManage
      featureAvailable={featureAvailable}
      allocationPreview={Object.fromEntries(allocationEntries)}
    />
  );
}
