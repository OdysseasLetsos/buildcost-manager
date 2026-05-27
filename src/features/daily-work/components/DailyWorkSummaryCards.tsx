"use client";

import type { DailyWorkSummary } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function DailyWorkSummaryCards({
  summary,
}: Readonly<{
  summary: DailyWorkSummary;
}>) {
  const cards = [
    { label: "Σύνολο Ωρών", value: summary.totalHours.toFixed(2), tone: "blue" },
    {
      label: "Σύνολο Υπερωριών",
      value: summary.totalOvertimeHours.toFixed(2),
      tone: "slate",
    },
    {
      label: "Έξοδα Εργαζομένων",
      value: currencyFormatter.format(summary.totalExpenseAmount),
      tone: "amber",
    },
    {
      label: "Σύνολο Καταχωρήσεων",
      value: String(summary.totalEntries),
      tone: "emerald",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-500">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
