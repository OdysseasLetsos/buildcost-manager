"use client";

import type { ManagedProject } from "../types";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString("el-GR") : "-";
}

function formatBudget(value: number | null): string {
  return value === null ? "-" : currencyFormatter.format(value);
}

export function ProjectsTable({
  projects,
  canManage,
  onEditProject,
}: Readonly<{
  projects: ManagedProject[];
  canManage: boolean;
  onEditProject: (project: ManagedProject) => void;
}>) {
  if (projects.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">
          Δεν υπάρχουν έργα ακόμα
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Δημιουργήστε το πρώτο έργο για να ξεκινήσει η παρακολούθηση κόστους.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Κωδικός</th>
              <th className="px-4 py-3 font-semibold">Όνομα Έργου</th>
              <th className="px-4 py-3 font-semibold">Πελάτης</th>
              <th className="px-4 py-3 font-semibold">Κατάσταση</th>
              <th className="px-4 py-3 font-semibold">Προϋπολογισμός</th>
              <th className="px-4 py-3 font-semibold">Προσφορά</th>
              <th className="px-4 py-3 font-semibold">Έναρξη</th>
              <th className="px-4 py-3 font-semibold">Λήξη</th>
              <th className="px-4 py-3 font-semibold">Ακύρωση</th>
              <th className="px-4 py-3 font-semibold">Ενέργειες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-4 py-4 font-medium text-slate-950">
                  {project.code}
                </td>
                <td className="px-4 py-4 text-slate-950">{project.name}</td>
                <td className="px-4 py-4 text-slate-700">
                  {project.client_name ?? "-"}
                </td>
                <td className="px-4 py-4">
                  <ProjectStatusBadge status={project.status} />
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {formatBudget(project.budget_amount)}
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {project.status === "offer"
                    ? formatDate(project.offer_date)
                    : "-"}
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {project.status === "in_progress" ||
                  project.status === "completed"
                    ? formatDate(project.start_date)
                    : "-"}
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {project.status === "in_progress" ||
                  project.status === "completed"
                    ? formatDate(project.end_date)
                    : "-"}
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {project.status === "cancelled"
                    ? formatDate(project.cancellation_date)
                    : "-"}
                </td>
                <td className="px-4 py-4">
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => onEditProject(project)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Επεξεργασία
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">Προβολή μόνο</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
