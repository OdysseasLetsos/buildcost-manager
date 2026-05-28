import type { MaterialsByProjectTotal } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("el-GR", {
  maximumFractionDigits: 1,
});

export function MaterialsByProjectChart({
  items,
}: Readonly<{
  items: MaterialsByProjectTotal[];
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">Υλικά ανά Έργο</h3>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article key={item.projectId} className="space-y-2">
            <div className="flex items-start justify-between gap-4 text-sm">
              <div>
                <p className="font-semibold text-slate-950">
                  {item.projectCode} - {item.projectName}
                </p>
                <p className="text-slate-500">{numberFormatter.format(item.percentage)}%</p>
              </div>
              <p className="font-semibold text-slate-950">
                {currencyFormatter.format(item.totalAmount)}
              </p>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-blue-900"
                style={{ width: `${Math.max(item.percentage, 2)}%` }}
              />
            </div>
          </article>
        ))}
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Δεν υπάρχουν τιμολόγια υλικών για απεικόνιση.
          </p>
        ) : null}
      </div>
    </section>
  );
}
