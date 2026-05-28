import type { IkaSummary } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function IkaSummaryCards({ summary }: Readonly<{ summary: IkaSummary }>) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-blue-50 p-4 text-sm text-blue-950">
      Σύνολο ΙΚΑ:{" "}
      <span className="font-semibold">
        {currencyFormatter.format(summary.totalAmount)}
      </span>
    </div>
  );
}
