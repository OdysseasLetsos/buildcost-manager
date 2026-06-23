"use client";

import { useActionState, useEffect, useState } from "react";
import type {
  ManagedProject,
  ProjectActionState,
  ProjectQuote,
  ProjectStatus,
} from "../types";
import { initialProjectActionState, projectStatuses } from "../types";
import { ProjectQuoteDraftCard } from "./ProjectQuoteDraftCard";
import { ProjectQuotesHistory } from "./ProjectQuotesHistory";
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

function DateField({
  label,
  name,
  defaultValue,
  required,
  disabled,
  error,
}: Readonly<{
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}>) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type="date"
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
      />
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </label>
  );
}

export function ProjectForm({
  action,
  project,
  quotes = [],
  submitLabel,
  onSuccess,
}: Readonly<{
  action: ProjectFormAction;
  project?: ManagedProject;
  quotes?: ProjectQuote[];
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialProjectActionState,
  );
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "offer",
  );
  const [isQuoteCardOpen, setIsQuoteCardOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<ProjectQuote | null>(null);
  const [quoteFeedback, setQuoteFeedback] = useState<string | null>(null);
  const [projectCode, setProjectCode] = useState(project?.code ?? "");
  const [projectName, setProjectName] = useState(project?.name ?? "");
  const [clientName, setClientName] = useState(project?.client_name ?? "");
  const [location, setLocation] = useState(project?.location ?? "");
  const [projectQuotes, setProjectQuotes] = useState(quotes);
  const isProjectLocked = project?.status === "completed";

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
            value={projectCode}
            onChange={(event) => setProjectCode(event.target.value)}
            required
            disabled={isProjectLocked}
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
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            required
            disabled={isProjectLocked}
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
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            disabled={isProjectLocked}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Τοποθεσία
          <input
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            disabled={isProjectLocked}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Κατάσταση
          <select
            name="status"
            value={status}
            disabled={isProjectLocked}
            onChange={(event) => {
              const nextStatus = event.target.value as ProjectStatus;
              setStatus(nextStatus);

              if (nextStatus !== "in_progress") {
                setIsQuoteCardOpen(false);
                setEditingQuote(null);
              }
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          >
            {projectStatuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
          {state.fieldErrors?.status ? (
            <span className="text-xs text-red-700">
              {state.fieldErrors.status}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Προϋπολογισμός
          <input
            name="budgetAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={formatBudgetValue(project?.budget_amount ?? null)}
            disabled={isProjectLocked}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          {state.fieldErrors?.budgetAmount ? (
            <span className="text-xs text-red-700">
              {state.fieldErrors.budgetAmount}
            </span>
          ) : null}
        </label>

        {status === "offer" ? (
          <DateField
            label="Ημερομηνία Προσφοράς"
            name="offerDate"
            defaultValue={formatDateValue(project?.offer_date ?? null)}
            disabled={isProjectLocked}
            error={state.fieldErrors?.offerDate}
          />
        ) : null}

        {status === "in_progress" || status === "completed" ? (
          <>
            <DateField
              label="Ημερομηνία Έναρξης"
              name="startDate"
              defaultValue={formatDateValue(project?.start_date ?? null)}
              required
              disabled={isProjectLocked}
              error={state.fieldErrors?.startDate}
            />
            <DateField
              label="Ημερομηνία Λήξης"
              name="endDate"
              defaultValue={formatDateValue(project?.end_date ?? null)}
              required={status === "completed"}
              disabled={isProjectLocked}
              error={state.fieldErrors?.endDate}
            />
          </>
        ) : null}

        {status === "cancelled" ? (
          <DateField
            label="Ημερομηνία Ακύρωσης"
            name="cancellationDate"
            defaultValue={formatDateValue(project?.cancellation_date ?? null)}
            required
            disabled={isProjectLocked}
            error={state.fieldErrors?.cancellationDate}
          />
        ) : null}
      </div>

      {project && status === "in_progress" ? (
        <section className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-950">
              Συμπληρωματική προσφορά
            </p>
            <p className="mt-1 text-xs text-blue-800">
              Δημιουργία νέας προσφοράς συνδεδεμένης με το ίδιο έργο
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuoteFeedback(null);
              setEditingQuote(null);
              setIsQuoteCardOpen(true);
            }}
            disabled={isQuoteCardOpen}
            className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-default disabled:opacity-55"
          >
            + Νέα προσφορά
          </button>
        </section>
      ) : null}

      {project && status === "completed" ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Το έργο έχει ολοκληρωθεί. Για αλλαγές απαιτείται επανενεργοποίηση ή
          νέο έργο.
        </p>
      ) : null}

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea
          name="notes"
          defaultValue={project?.notes ?? ""}
          rows={4}
          disabled={isProjectLocked}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      {project && status === "in_progress" && isQuoteCardOpen ? (
        <ProjectQuoteDraftCard
          key={editingQuote?.id ?? "new-project-quote"}
          project={{
            id: project.id,
            code: projectCode,
            name: projectName,
            clientName,
            location,
          }}
          quote={editingQuote ?? undefined}
          onSaved={(quote) => {
            setQuoteFeedback(
              editingQuote
                ? "Η προσφορά ενημερώθηκε επιτυχώς."
                : "Η προσφορά αποθηκεύτηκε επιτυχώς.",
            );
            setProjectQuotes((current) => {
              const quoteExists = current.some((item) => item.id === quote.id);
              return quoteExists
                ? current.map((item) => (item.id === quote.id ? quote : item))
                : [quote, ...current];
            });
            setIsQuoteCardOpen(false);
            setEditingQuote(null);
          }}
          onClose={() => {
            setIsQuoteCardOpen(false);
            setEditingQuote(null);
          }}
        />
      ) : null}

      {quoteFeedback ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {quoteFeedback}
        </p>
      ) : null}

      {project ? (
        <ProjectQuotesHistory
          quotes={projectQuotes}
          projectStatus={project.status}
          onEdit={(quote) => {
            setQuoteFeedback(null);
            setEditingQuote(quote);
            setIsQuoteCardOpen(true);
          }}
          onDeleted={(quoteId) => {
            setProjectQuotes((current) =>
              current.filter((quote) => quote.id !== quoteId),
            );
            if (editingQuote?.id === quoteId) {
              setEditingQuote(null);
              setIsQuoteCardOpen(false);
            }
          }}
        />
      ) : null}

      <button
        type="submit"
        disabled={isPending || isProjectLocked}
        className="justify-self-start rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
      >
        {isProjectLocked
          ? "Το έργο είναι κλειδωμένο"
          : isPending
            ? "Αποθήκευση..."
            : submitLabel}
      </button>
    </form>
  );
}
