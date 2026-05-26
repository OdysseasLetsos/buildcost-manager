import type { ProjectStatus } from "../types";

const statusLabels: Record<ProjectStatus, string> = {
  active: "Ενεργό",
  in_progress: "Σε εξέλιξη",
  completed: "Ολοκληρωμένο",
  archived: "Αρχειοθετημένο",
};

const statusClassNames: Record<ProjectStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  completed: "border-slate-200 bg-slate-50 text-slate-700",
  archived: "border-amber-200 bg-amber-50 text-amber-800",
};

export function ProjectStatusBadge({
  status,
}: Readonly<{
  status: ProjectStatus;
}>) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassNames[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

export { statusLabels };
