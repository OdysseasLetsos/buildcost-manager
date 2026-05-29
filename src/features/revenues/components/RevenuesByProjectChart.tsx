import type { RevenuesByProjectTotal } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("el-GR", {
  maximumFractionDigits: 1,
});

export function RevenuesByProjectChart({
  items,
}: Readonly<{
  items: RevenuesByProjectTotal[];
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">Έσοδα ανά Έργο</h3>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article key={item.projectId} className="space-y-2">
            <div className="flex flex-col gap-2 text-sm lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{item.projectCode} - {item.projectName}</p>
                <p className="text-slate-500">{numberFormatter.format(item.percentage)}% των εισπράξεων</p>
              </div>
              <div className="grid gap-1 text-slate-700 sm:grid-cols-3 lg:text-right">
                <p>Τιμ.: {currencyFormatter.format(item.invoicedAmount)}</p>
                <p>Εισπ.: {currencyFormatter.format(item.receivedAmount)}</p>
                <p>Υπόλ.: {currencyFormatter.format(item.remainingAmount)}</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${Math.max(item.percentage, 2)}%` }} />
            </div>
          </article>
        ))}
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Δεν υπάρχουν έσοδα για απεικόνιση ανά έργο.
          </p>
        ) : null}
      </div>
    </section>
  );
}
