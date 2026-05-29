"use client";

import { useActionState, useEffect, useState } from "react";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import {
  revenueStatusLabels,
  revenueStatuses,
  revenueTypeLabels,
  revenueTypes,
  type RevenueType,
} from "../constants";
import type { Revenue, RevenueActionState } from "../types";
import { initialRevenueActionState } from "../types";

type RevenueFormAction = (
  previousState: RevenueActionState,
  formData: FormData,
) => Promise<RevenueActionState>;

function decimalValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function RevenueForm({
  action,
  revenue,
  monthlyPeriods,
  projects,
  defaultMonthId,
  submitLabel,
  onSuccess,
}: Readonly<{
  action: RevenueFormAction;
  revenue?: Revenue;
  monthlyPeriods: MonthlyPeriod[];
  projects: Project[];
  defaultMonthId: string;
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(action, initialRevenueActionState);
  const [revenueType, setRevenueType] = useState<RevenueType>(
    revenue?.revenue_type ?? "invoice",
  );

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [onSuccess, state.ok]);

  return (
    <form action={formAction} className="grid gap-4">
      {revenue ? <input type="hidden" name="id" value={revenue.id} /> : null}
      {state.message ? (
        <p className={`rounded-lg border px-4 py-3 text-sm ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Μήνας
          <select name="monthId" defaultValue={revenue?.month_id ?? defaultMonthId} required className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Επιλέξτε μήνα</option>
            {monthlyPeriods.map((period) => <option key={period.id} value={period.id}>{period.month_key}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ημερομηνία
          <input name="revenueDate" type="date" defaultValue={revenue?.revenue_date ?? ""} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Έργο
          <select name="projectId" defaultValue={revenue?.project_id ?? ""} required className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Επιλέξτε έργο</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.code} - {project.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Πελάτης
          <input name="clientName" defaultValue={revenue?.client_name ?? ""} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Αριθμός Τιμολογίου
          <input name="invoiceNumber" defaultValue={revenue?.invoice_number ?? ""} className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Τύπος Εσόδου
          <select name="revenueType" value={revenueType} onChange={(event) => setRevenueType(event.target.value as RevenueType)} required className="rounded-lg border border-slate-300 px-3 py-2">
            {revenueTypes.map((type) => <option key={type} value={type}>{revenueTypeLabels[type]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Τιμολογηθέν Ποσό
          <input name="invoicedAmount" type="number" min="0" step="0.01" defaultValue={decimalValue(revenue?.invoiced_amount ?? (revenueType === "invoice" ? undefined : 0))} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Εισπραχθέν Ποσό
          <input name="receivedAmount" type="number" min="0" step="0.01" defaultValue={decimalValue(revenue?.received_amount ?? 0)} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Υπόλοιπο
          <input name="remainingAmount" type="number" min="0" step="0.01" defaultValue={decimalValue(revenue?.remaining_amount ?? 0)} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Κατάσταση
          <select name="status" defaultValue={revenue?.status ?? "pending"} required className="rounded-lg border border-slate-300 px-3 py-2">
            {revenueStatuses.map((status) => <option key={status} value={status}>{revenueStatusLabels[status]}</option>)}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea name="notes" defaultValue={revenue?.notes ?? ""} rows={3} className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <button type="submit" disabled={isPending} className="justify-self-start rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? "Αποθήκευση..." : submitLabel}
      </button>
    </form>
  );
}
