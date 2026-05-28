import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany } from "@/src/core/tenants";
import { getEmployees } from "@/src/features/employees/services/get-employees";
import { getEmployeeIka } from "@/src/features/ika/services/get-employee-ika";
import { getIkaAllocationPreview } from "@/src/features/ika/services/get-ika-allocation-preview";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";
import { PaymentsPageClient } from "@/src/features/payments/components/PaymentsPageClient";
import { getEmployeePayments } from "@/src/features/payments/services/get-employee-payments";
import { getPaymentAllocationPreview } from "@/src/features/payments/services/get-payment-allocation-preview";

export default async function PaymentsPage() {
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
          Δεν έχετε δικαίωμα πρόσβασης στις πληρωμές και το ΙΚΑ.
        </h2>
      </section>
    );
  }

  const [paymentsFeatureAvailable, ikaFeatureAvailable] = await Promise.all([
    canUseFeature(companyId, "payments"),
    canUseFeature(companyId, "ika"),
  ]);

  if (!paymentsFeatureAvailable || !ikaFeatureAvailable) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-amber-950">
          Το τρέχον πακέτο της εταιρείας δεν περιλαμβάνει Πληρωμές & ΙΚΑ.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-amber-900">
          Ελέγξτε το πακέτο της εταιρείας ή ζητήστε ενεργοποίηση των λειτουργιών
          πληρωμών και ΙΚΑ.
        </p>
      </section>
    );
  }

  const monthlyPeriods = await getMonthlyPeriods(companyId);
  const latestOpenMonth = monthlyPeriods.find(
    (period) => period.status === "open" && !period.is_locked,
  );
  const defaultMonthId = latestOpenMonth?.id ?? monthlyPeriods[0]?.id ?? "";

  const [
    payments,
    ikaRows,
    allEmployees,
    paymentAllocationEntries,
    ikaAllocationEntries,
  ] = await Promise.all([
    getEmployeePayments(companyId),
    getEmployeeIka(companyId),
    getEmployees(companyId),
    Promise.all(
      monthlyPeriods.map(
        async (period) =>
          [
            period.id,
            await getPaymentAllocationPreview(companyId, period.id),
          ] as const,
      ),
    ),
    Promise.all(
      monthlyPeriods.map(
        async (period) =>
          [
            period.id,
            await getIkaAllocationPreview(companyId, period.id),
          ] as const,
      ),
    ),
  ]);

  return (
    <PaymentsPageClient
      payments={payments}
      ikaRows={ikaRows}
      monthlyPeriods={monthlyPeriods}
      employees={allEmployees.filter((employee) => employee.active)}
      defaultMonthId={defaultMonthId}
      canManage
      paymentsFeatureAvailable={paymentsFeatureAvailable}
      ikaFeatureAvailable={ikaFeatureAvailable}
      paymentAllocationPreview={Object.fromEntries(paymentAllocationEntries)}
      ikaAllocationPreview={Object.fromEntries(ikaAllocationEntries)}
    />
  );
}
