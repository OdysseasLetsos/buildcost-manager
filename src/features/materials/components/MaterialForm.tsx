"use client";

import { useActionState, useEffect } from "react";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import type { Material, MaterialActionState } from "../types";
import { initialMaterialActionState } from "../types";

type MaterialFormAction = (
  previousState: MaterialActionState,
  formData: FormData,
) => Promise<MaterialActionState>;

function decimalValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function MaterialForm({
  action,
  material,
  monthlyPeriods,
  projects,
  defaultMonthId,
  submitLabel,
  onSuccess,
}: Readonly<{
  action: MaterialFormAction;
  material?: Material;
  monthlyPeriods: MonthlyPeriod[];
  projects: Project[];
  defaultMonthId: string;
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(action, initialMaterialActionState);

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [onSuccess, state.ok]);

  return (
    <form action={formAction} className="grid gap-4">
      {material ? <input type="hidden" name="id" value={material.id} /> : null}
      {state.message ? (
        <p className={`rounded-lg border px-4 py-3 text-sm ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Μήνας
          <select name="monthId" defaultValue={material?.month_id ?? defaultMonthId} required className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Επιλέξτε μήνα</option>
            {monthlyPeriods.map((period) => <option key={period.id} value={period.id}>{period.month_key}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ημερομηνία Τιμολογίου
          <input name="invoiceDate" type="date" defaultValue={material?.invoice_date ?? ""} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Έργο
          <select name="projectId" defaultValue={material?.project_id ?? ""} required className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Επιλέξτε έργο</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.code} - {project.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Προμηθευτής
          <input name="supplierName" defaultValue={material?.supplier_name ?? ""} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          ΑΦΜ Προμηθευτή
          <input name="supplierVat" defaultValue={material?.supplier_vat ?? ""} className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Αριθμός Τιμολογίου
          <input name="invoiceNumber" defaultValue={material?.invoice_number ?? ""} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Καθαρή Αξία
          <input name="netAmount" type="number" min="0" step="0.01" defaultValue={decimalValue(material?.net_amount)} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          ΦΠΑ
          <input name="vatAmount" type="number" min="0" step="0.01" defaultValue={decimalValue(material?.vat_amount)} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Σύνολο
          <input name="totalAmount" type="number" min="0" step="0.01" defaultValue={decimalValue(material?.total_amount)} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Κατάσταση Πληρωμής
          <select name="paymentStatus" defaultValue={material?.payment_status ?? "pending"} required className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="pending">Εκκρεμεί</option>
            <option value="paid">Πληρωμένο</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Περιγραφή
        <textarea name="description" defaultValue={material?.description ?? ""} rows={3} className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea name="notes" defaultValue={material?.notes ?? ""} rows={3} className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <button type="submit" disabled={isPending} className="justify-self-start rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? "Αποθήκευση..." : submitLabel}
      </button>
    </form>
  );
}
