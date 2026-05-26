"use client";

import { useActionState, useEffect } from "react";
import type { Project, ProjectActionState } from "../types";
import { initialProjectActionState, projectStatuses } from "../types";
import { statusLabels } from "./ProjectStatusBadge";

type ProjectFormAction = (
  previousState: ProjectActionState,
  formData: FormData,
) => Promise<ProjectActionState>;

function formatDateValue(value: string | null): string {
  return value ?? "";
}

function formatBudgetValue(value: number | null): string {
  return value === null ? "" : String(value);
}

export function ProjectForm({
  action,
  project,
  submitLabel,
  onSuccess,
}: Readonly<{
  action: ProjectFormAction;
  project?: Project;
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialProjectActionState,
  );

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
  }, [onSuccess, state.ok]);

  return (
    <form action={formAction} className="grid gap-4">
      {project ? <input type="hidden" name="projectId" value={project.id} /> : null}

      {state.message ? (
        <p
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Κωδικός
          <input
            name="code"
            defaultValue={project?.code ?? ""}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          {state.fieldErrors?.code ? (
            <span className="text-xs text-red-700">{state.fieldErrors.code}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Όνομα Έργου
          <input
            name="name"
            defaultValue={project?.name ?? ""}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          {state.fieldErrors?.name ? (
            <span className="text-xs text-red-700">{state.fieldErrors.name}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Πελάτης
          <input
            name="clientName"
            defaultValue={project?.client_name ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Τοποθεσία
          <input
            name="location"
            defaultValue={project?.location ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Κατάσταση
          <select
            name="status"
            defaultValue={project?.status ?? "active"}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          >
            {projectStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Προϋπολογισμός
          <input
            name="budgetAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={formatBudgetValue(project?.budget_amount ?? null)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          {state.fieldErrors?.budgetAmount ? (
            <span className="text-xs text-red-700">
              {state.fieldErrors.budgetAmount}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ημερομηνία Έναρξης
          <input
            name="startDate"
            type="date"
            defaultValue={formatDateValue(project?.start_date ?? null)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ημερομηνία Λήξης
          <input
            name="endDate"
            type="date"
            defaultValue={formatDateValue(project?.end_date ?? null)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          {state.fieldErrors?.endDate ? (
            <span className="text-xs text-red-700">{state.fieldErrors.endDate}</span>
          ) : null}
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea
          name="notes"
          defaultValue={project?.notes ?? ""}
          rows={4}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="justify-self-start rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
      >
        {isPending ? "Αποθήκευση..." : submitLabel}
      </button>
    </form>
  );
}
