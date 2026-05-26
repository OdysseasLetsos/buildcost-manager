import type { DashboardSummaryMetric } from "../types";

const toneClassNames: Record<DashboardSummaryMetric["tone"], string> = {
  blue: "border-blue-100 bg-blue-50 text-blue-800",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
  amber: "border-amber-100 bg-amber-50 text-amber-800",
  slate: "border-slate-100 bg-slate-50 text-slate-700",
};

export function DashboardSummaryCards({
  activeProjectCount,
}: Readonly<{
  activeProjectCount: number;
}>) {
  const metrics: DashboardSummaryMetric[] = [
    {
      label: "Σύνολο Εσόδων",
      value: "€0,00",
      helper: "Θα συνδεθεί με το module εσόδων.",
      tone: "emerald",
    },
    {
      label: "Σύνολο Εξόδων",
      value: "€0,00",
      helper: "Θα συνδεθεί με έξοδα, υλικά, πληρωμές και ΙΚΑ.",
      tone: "amber",
    },
    {
      label: "Κέρδος Μήνα",
      value: "€0,00",
      helper: "Υπολογισμός μετά τα οικονομικά modules.",
      tone: "blue",
    },
    {
      label: "Ενεργά Έργα",
      value: String(activeProjectCount),
      helper: "Από τα πραγματικά έργα της εταιρείας.",
      tone: "slate",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
        >
          <div
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneClassNames[metric.tone]}`}
          >
            {metric.label}
          </div>
          <p className="mt-4 text-3xl font-semibold text-slate-950">
            {metric.value}
          </p>
          <p className="mt-2 text-sm leading-5 text-slate-500">{metric.helper}</p>
        </article>
      ))}
    </section>
  );
}
