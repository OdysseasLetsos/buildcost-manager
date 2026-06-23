import type { ProjectStatus } from "../types";

export const statusLabels: Record<ProjectStatus, string> = {
  offer: "Προσφορά",
  in_progress: "Ενεργό / Σε εξέλιξη",
  completed: "Ολοκληρωμένο / Αρχειοθετημένο",
  cancelled: "Ακυρωμένο",
};

const statusClassNames: Record<ProjectStatus, string> = {
  offer: "border-sky-200 bg-sky-50 text-sky-800",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
};

export function ProjectStatusBadge({
  status,
}: Readonly<{ status: ProjectStatus }>) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassNames[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
