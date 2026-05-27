import type {
  DashboardDailyWorkStats,
  DashboardEmployeeStats,
  DashboardMonthlyPeriodStats,
  DashboardProjectStats,
  DashboardSummaryMetric,
} from "../types";

const toneClassNames: Record<DashboardSummaryMetric["tone"], string> = {
  blue: "border-blue-100 bg-blue-50 text-blue-800",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
  amber: "border-amber-100 bg-amber-50 text-amber-800",
  slate: "border-slate-100 bg-slate-50 text-slate-700",
};

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("el-GR", {
  maximumFractionDigits: 2,
});

export function DashboardSummaryCards({
  projectStats,
  employeeStats,
  monthlyPeriodStats,
  dailyWorkStats,
}: Readonly<{
  projectStats: DashboardProjectStats;
  employeeStats: DashboardEmployeeStats;
  monthlyPeriodStats: DashboardMonthlyPeriodStats;
  dailyWorkStats: DashboardDailyWorkStats;
}>) {
  const metrics: DashboardSummaryMetric[] = [
    {
      label: "Ενεργά Έργα",
      value: String(projectStats.activeProjects),
      helper: `${projectStats.totalProjects} συνολικά έργα.`,
      tone: "slate",
    },
    {
      label: "Ενεργοί Εργαζόμενοι",
      value: String(employeeStats.activeEmployees),
      helper: `${employeeStats.totalEmployees} συνολικά άτομα.`,
      tone: "blue",
    },
    {
      label: "Τρέχων Μήνας",
      value: monthlyPeriodStats.selectedMonth?.month_key ?? "-",
      helper: monthlyPeriodStats.latestOpenMonth
        ? "Τελευταίος ανοιχτός μήνας."
        : "Δεν υπάρχει ανοιχτός μήνας.",
      tone: "emerald",
    },
    {
      label: "Σύνολο Ωρών",
      value: numberFormatter.format(dailyWorkStats.totalHours),
      helper: `${dailyWorkStats.totalEntries} καταχωρήσεις στον επιλεγμένο μήνα.`,
      tone: "blue",
    },
    {
      label: "Υπερωρίες",
      value: numberFormatter.format(dailyWorkStats.totalOvertimeHours),
      helper: "Πραγματικές υπερωρίες από ημερήσια εργασία.",
      tone: "amber",
    },
    {
      label: "Έξοδα Εργαζομένων",
      value: currencyFormatter.format(dailyWorkStats.totalExpenseAmount),
      helper: "Ποσά εξόδων από ημερήσιες καταχωρήσεις.",
      tone: "emerald",
    },
    {
      label: "Εκτιμώμενο Κόστος Εργασίας",
      value: currencyFormatter.format(dailyWorkStats.estimatedLaborCost),
      helper: "Με βάση ωρομίσθιο ή ημερομίσθιο / 8.",
      tone: "amber",
    },
    {
      label: "Κλειδωμένοι Μήνες",
      value: String(monthlyPeriodStats.lockedMonths),
      helper: `${monthlyPeriodStats.openMonths} ανοιχτοί μήνες.`,
      tone: "slate",
    },
  ];

  // TODO: Real revenue, expense and profit totals require the Revenues,
  // Expenses, Payments, Materials and IKA modules.
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
