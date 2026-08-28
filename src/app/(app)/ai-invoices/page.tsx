import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany } from "@/src/core/tenants";
import { AiInvoicesPanel } from "@/src/features/ai-invoices/components/AiInvoicesPanel";
import { getInvoiceSummary } from "@/src/features/ai-invoices/services/get-invoice-summary";
import { listInvoiceDocuments } from "@/src/features/ai-invoices/services/list-invoice-documents";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";

export default async function AiInvoicesPage() {
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
          Δεν έχετε δικαίωμα πρόσβασης στην ανάλυση τιμολογίων.
        </h2>
      </section>
    );
  }

  const [featureAvailable, monthlyPeriods] = await Promise.all([
    canUseFeature(companyId, "ai_invoice_import"),
    getMonthlyPeriods(companyId),
  ]);

  if (!featureAvailable) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-amber-950">
          Η λειτουργία AI τιμολογίων δεν είναι διαθέσιμη στο πλάνο σας.
        </h2>
      </section>
    );
  }

  const invoiceDocuments = await listInvoiceDocuments(companyId);
  const latestOpenMonth = monthlyPeriods.find(
    (period) => period.status === "open" && !period.is_locked,
  );

  return (
    <AiInvoicesPanel
      documents={invoiceDocuments}
      summary={getInvoiceSummary(invoiceDocuments)}
      monthlyPeriods={monthlyPeriods}
      defaultMonthKey={latestOpenMonth?.month_key ?? monthlyPeriods[0]?.month_key ?? ""}
    />
  );
}
