import type { DashboardProject } from "../types";

const statusLabels: Record<string, string> = {
  active: "Ενεργό",
  in_progress: "Σε εξέλιξη",
  completed: "Ολοκληρωμένο",
  archived: "Αρχειοθετημένο",
};

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function ProjectOverviewCard({
  project,
}: Readonly<{
  project: DashboardProject;
}>) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
            {project.code}
          </p>
          <h3 className="mt-2 text-base font-semibold text-slate-950">
            {project.name}
          </h3>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
          {statusLabels[project.status] ?? project.status}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Πελάτης</dt>
          <dd className="truncate font-medium text-slate-800">
            {project.client_name ?? "-"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Τοποθεσία</dt>
          <dd className="truncate font-medium text-slate-800">
            {project.location ?? "-"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Προϋπολογισμός</dt>
          <dd className="font-semibold text-slate-950">
            {project.budget_amount === null
              ? "-"
              : currencyFormatter.format(project.budget_amount)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
