"use client";

import { useActionState, useEffect, useState } from "react";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import {
  revenueStatusLabels,
  revenueStatuses,
  revenueTypeLabels,
  revenueTypes,
  type RevenueStatus,
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

function parseAmount(value: string): number {
  const amount = Number(value.replace(",", "."));
  return Number.isFinite(amount) ? amount : 0;
}

function formattedAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function calculateDerivedFields({
  revenueType,
  invoicedAmount,
  receivedAmount,
}: {
  revenueType: RevenueType;
  invoicedAmount: number;
  receivedAmount: number;
}): { remainingAmount: number; status: RevenueStatus } {
  if (revenueType === "invoice") {
    const remainingAmount = Math.max(invoicedAmount - receivedAmount, 0);
    if (remainingAmount === 0 && invoicedAmount > 0) {
      return { remainingAmount, status: "paid" };
    }
    if (receivedAmount > 0 && remainingAmount > 0) {
      return { remainingAmount, status: "partial" };
    }
    return { remainingAmount, status: "pending" };
  }

  return { remainingAmount: 0, status: "paid" };
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
  const [state, formAction, isPending] = useActionState(
    action,
    initialRevenueActionState,
  );
  const [revenueType, setRevenueType] = useState<RevenueType>(
    revenue?.revenue_type ?? "invoice",
  );
  const [invoicedAmount, setInvoicedAmount] = useState(
    decimalValue(revenue?.invoiced_amount ?? (revenueType === "invoice" ? undefined : 0)),
  );
  const [receivedAmount, setReceivedAmount] = useState(
    decimalValue(revenue?.received_amount ?? 0),
  );
  const [statusOverride, setStatusOverride] = useState<RevenueStatus | null>(
    revenue?.status === "cancelled" ? "cancelled" : null,
  );
  const derivedFields = calculateDerivedFields({
    revenueType,
    invoicedAmount: parseAmount(invoicedAmount),
    receivedAmount: parseAmount(receivedAmount),
  });
  const remainingAmount = formattedAmount(derivedFields.remainingAmount);
  const status = statusOverride === "cancelled" ? "cancelled" : derivedFields.status;

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [onSuccess, state.ok]);

  return (
    <form action={formAction} className="grid gap-4">
      {revenue ? <input name="id" type="hidden" value={revenue.id} /> : null}
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
          Μήνας
          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            defaultValue={revenue?.month_id ?? defaultMonthId}
            name="monthId"
            required
          >
            <option value="">Επιλέξτε μήνα</option>
            {monthlyPeriods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.month_key}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ημερομηνία
          <input
            className="rounded-lg border border-slate-300 px-3 py-2"
            defaultValue={revenue?.revenue_date ?? ""}
            name="revenueDate"
            required
            type="date"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Έργο
          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            defaultValue={revenue?.project_id ?? ""}
            name="projectId"
            required
          >
            <option value="">Επιλέξτε έργο</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Πελάτης
          <input
            className="rounded-lg border border-slate-300 px-3 py-2"
            defaultValue={revenue?.client_name ?? ""}
            name="clientName"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Αριθμός Τιμολογίου
          <input
            className="rounded-lg border border-slate-300 px-3 py-2"
            defaultValue={revenue?.invoice_number ?? ""}
            name="invoiceNumber"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Τύπος Εσόδου
          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            name="revenueType"
            onChange={(event) => setRevenueType(event.target.value as RevenueType)}
            required
            value={revenueType}
          >
            {revenueTypes.map((type) => (
              <option key={type} value={type}>
                {revenueTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Τιμολογηθέν Ποσό
          <input
            className="rounded-lg border border-slate-300 px-3 py-2"
            min="0"
            name="invoicedAmount"
            onChange={(event) => setInvoicedAmount(event.target.value)}
            required
            step="0.01"
            type="number"
            value={invoicedAmount}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Εισπραχθέν Ποσό
          <input
            className="rounded-lg border border-slate-300 px-3 py-2"
            min="0"
            name="receivedAmount"
            onChange={(event) => setReceivedAmount(event.target.value)}
            required
            step="0.01"
            type="number"
            value={receivedAmount}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Υπόλοιπο
          <input
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
            min="0"
            name="remainingAmount"
            readOnly
            required
            step="0.01"
            type="number"
            value={remainingAmount}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Κατάσταση
          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            name="status"
            onChange={(event) => {
              const nextStatus = event.target.value as RevenueStatus;
              setStatusOverride(nextStatus === "cancelled" ? "cancelled" : null);
            }}
            required
            value={status}
          >
            {revenueStatuses.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {revenueStatusLabels[statusOption]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea
          className="rounded-lg border border-slate-300 px-3 py-2"
          defaultValue={revenue?.notes ?? ""}
          name="notes"
          rows={3}
        />
      </label>

      <button
        className="justify-self-start rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Αποθήκευση..." : submitLabel}
      </button>
    </form>
  );
}
