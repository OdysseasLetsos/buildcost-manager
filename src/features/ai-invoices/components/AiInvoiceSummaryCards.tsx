import type { InvoiceSummary } from "../types";

const cards = [
  ["Σύνολο εγγράφων", "totalDocuments"],
  ["Σε αναμονή ανάλυσης", "pendingExtraction"],
  ["Σε έλεγχο", "inReview"],
  ["Ολοκληρωμένα / Απορριφθέντα", "completedOrRejected"],
] as const;

export function AiInvoiceSummaryCards({
  summary,
}: Readonly<{
  summary: InvoiceSummary;
}>) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, key]) => (
        <div
          key={key}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {summary[key]}
          </p>
        </div>
      ))}
    </section>
  );
}
