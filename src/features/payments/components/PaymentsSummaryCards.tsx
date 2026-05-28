import type { IkaSummary } from "@/src/features/ika/types";
import type { PaymentsSummary } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function PaymentsSummaryCards({
  paymentsSummary,
  ikaSummary,
}: Readonly<{
  paymentsSummary: PaymentsSummary;
  ikaSummary: IkaSummary;
}>) {
  const totalToAllocate = paymentsSummary.totalAmount + ikaSummary.totalAmount;

  const cards = [
    ["Σύνολο Πληρωμών", currencyFormatter.format(paymentsSummary.totalAmount)],
    ["Εργαζόμενοι με Πληρωμές", String(paymentsSummary.employeeCount)],
    ["Σύνολο ΙΚΑ", currencyFormatter.format(ikaSummary.totalAmount)],
    ["Εργαζόμενοι με ΙΚΑ", String(ikaSummary.employeeCount)],
    ["Προς Κατανομή", currencyFormatter.format(totalToAllocate)],
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map(([label, value]) => (
        <article
          key={label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
        </article>
      ))}
    </section>
  );
}
