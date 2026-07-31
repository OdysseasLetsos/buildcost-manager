"use client";

import { useState, useTransition } from "react";
import type { ManagedProject, ProjectQuoteTotals } from "../types";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString("el-GR") : "-";
}

function formatBudget(value: number | null | undefined): string {
  return value == null ? "-" : currencyFormatter.format(value);
}

export function ProjectsTable({
  projects,
  quoteTotalsByProject,
  canManage,
  canDelete,
  onEditProject,
  onDeleteProject,
  onDeleteSuccess,
}: Readonly<{
  projects: ManagedProject[];
  quoteTotalsByProject: Record<string, ProjectQuoteTotals>;
  canManage: boolean;
  canDelete: boolean;
  onEditProject: (project: ManagedProject) => void;
  onDeleteProject: (projectId: string) => Promise<{ ok: boolean; message?: string }>;
  onDeleteSuccess: () => void;
}>) {
  const [projectToDelete, setProjectToDelete] = useState<ManagedProject | null>(
    null,
  );
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

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
        <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Κωδικός</th>
              <th className="px-4 py-3 font-semibold">Όνομα Έργου</th>
              <th className="px-4 py-3 font-semibold">Πελάτης</th>
              <th className="px-4 py-3 font-semibold">Κατάσταση</th>
              <th className="px-4 py-3 font-semibold">
                Αρχικός προϋπολογισμός
              </th>
              <th className="px-4 py-3 font-semibold">
                Εγκεκριμένες προσφορές
              </th>
              <th className="px-4 py-3 font-semibold">Σε αναμονή</th>
              <th className="px-4 py-3 font-semibold">Προσφορά</th>
              <th className="px-4 py-3 font-semibold">Έναρξη</th>
              <th className="px-4 py-3 font-semibold">Λήξη</th>
              <th className="px-4 py-3 font-semibold">Ακύρωση</th>
              <th className="px-4 py-3 font-semibold">Ενέργειες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => {
              const quoteTotals = quoteTotalsByProject[project.id];

              return (
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
                    {formatBudget(
                      quoteTotals?.initialBudget ?? project.budget_amount,
                    )}
                  </td>
                  <td className="px-4 py-4 font-semibold text-emerald-800">
                    {currencyFormatter.format(
                      quoteTotals?.approvedQuotesTotal ?? 0,
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {currencyFormatter.format(
                      quoteTotals?.pendingQuotesTotal ?? 0,
                    )}
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
                    {canManage || canDelete ? (
                      <div className="flex flex-wrap gap-2">
                        {canManage ? (
                          <button
                            type="button"
                            onClick={() => onEditProject(project)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Επεξεργασία
                          </button>
                        ) : null}

                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteMessage(null);
                              setProjectToDelete(project);
                            }}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                          >
                            Διαγραφή
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Προβολή μόνο
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {projectToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Επιβεβαίωση διαγραφής
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  Διαγραφή έργου
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) {
                    setProjectToDelete(null);
                    setDeleteMessage(null);
                  }
                }}
                disabled={isDeleting}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Κλείσιμο
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-700">
              Θέλετε σίγουρα να διαγράψετε το έργο &apos;{projectToDelete.name}
              &apos;;
            </p>
            <p className="mt-2 text-sm leading-6 text-red-700">
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </p>

            {deleteMessage ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {deleteMessage}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setProjectToDelete(null);
                  setDeleteMessage(null);
                }}
                disabled={isDeleting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ακύρωση
              </button>
              <button
                type="button"
                onClick={() => {
                  startDeleteTransition(async () => {
                    const result = await onDeleteProject(projectToDelete.id);

                    if (result.ok) {
                      setProjectToDelete(null);
                      setDeleteMessage(null);
                      onDeleteSuccess();
                      return;
                    }

                    setDeleteMessage(
                      result.message ?? "Δεν ήταν δυνατή η διαγραφή του έργου.",
                    );
                  });
                }}
                disabled={isDeleting}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Διαγραφή..." : "Διαγραφή έργου"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
