import type {
  DashboardDailyWorkProjectTotals,
  DashboardFinancialProject,
  DashboardProject,
} from "../types";

const statusLabels: Record<string, string> = {
  active: "Ενεργό",
  in_progress: "Σε εξέλιξη",
  completed: "Ολοκληρωμένο",
  archived: "Αρχειοθετημένο",
  healthy: "Υγιές",
  low_margin: "Χαμηλό Περιθώριο",
  loss: "Ζημιά",
  no_revenue: "Χωρίς Έσοδα",
};

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("el-GR", {
  maximumFractionDigits: 1,
});

export function DashboardProjectCard({
  project,
  workTotals,
  financialProject,
  canViewFinancials,
}: Readonly<{
  project: DashboardProject;
  workTotals?: DashboardDailyWorkProjectTotals;
  financialProject?: DashboardFinancialProject;
  canViewFinancials: boolean;
}>) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{project.code}</p>
          <h3 className="mt-2 text-base font-semibold text-slate-950">{project.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{project.client_name ?? "-"}</p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
          {statusLabels[financialProject?.status ?? project.status] ?? project.status}
        </span>
      </div>

      {canViewFinancials ? (
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Έσοδα</dt>
            <dd className="font-semibold text-slate-950">{currencyFormatter.format(financialProject?.revenue ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Κόστος</dt>
            <dd className="font-semibold text-slate-950">{currencyFormatter.format(financialProject?.totalCost ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Κέρδος</dt>
            <dd className="font-semibold text-slate-950">{currencyFormatter.format(financialProject?.profit ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Περιθώριο</dt>
            <dd className="font-semibold text-slate-950">
              {financialProject?.margin === null || financialProject?.margin === undefined
                ? "-"
                : `${numberFormatter.format(financialProject.margin * 100)}%`}
            </dd>
          </div>
        </dl>
      ) : (
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Ώρες</dt>
            <dd className="font-semibold text-slate-950">{numberFormatter.format(workTotals?.totalHours ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Υπερωρίες</dt>
            <dd className="font-semibold text-slate-950">{numberFormatter.format(workTotals?.totalOvertimeHours ?? 0)}</dd>
          </div>
        </dl>
      )}
    </article>
  );
}
