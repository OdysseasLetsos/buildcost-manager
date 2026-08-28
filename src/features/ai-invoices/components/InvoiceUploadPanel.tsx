"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import { uploadInvoiceDocument } from "../actions/upload-invoice-document";
import { initialInvoiceActionState } from "../types";

export function InvoiceUploadPanel({
  monthlyPeriods,
  defaultMonthKey,
}: Readonly<{
  monthlyPeriods: MonthlyPeriod[];
  defaultMonthKey: string;
}>) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    uploadInvoiceDocument,
    initialInvoiceActionState,
  );

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-blue-700">Νέο Τιμολόγιο</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-950">
        Νέο Τιμολόγιο με AI
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Ανέβασε τιμολόγιο για αυτόματη ανάγνωση.
      </p>

      <form ref={formRef} action={formAction} className="mt-5 space-y-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Μήνας
          <select
            name="selectedMonthKey"
            defaultValue={defaultMonthKey}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Χωρίς μήνα</option>
            {monthlyPeriods.map((period) => (
              <option key={period.id} value={period.month_key}>
                {period.month_key}
              </option>
            ))}
          </select>
        </label>

        <label className="block cursor-pointer rounded-2xl border border-dashed border-blue-300 bg-blue-50/50 px-4 py-8 text-center transition hover:bg-blue-50">
          <span className="block text-sm font-semibold text-slate-900">
            Σύρε & άφησε αρχείο εδώ ή επίλεξε αρχείο
          </span>
          <span className="mt-2 block text-xs text-slate-500">
            PDF, JPG, PNG ή WEBP έως 20MB
          </span>
          <input
            name="invoiceFile"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            required
            className="sr-only"
          />
        </label>

        {state.message ? (
          <div
            className={`rounded-lg border p-3 text-sm ${
              state.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Ανέβασμα..." : "Νέο Τιμολόγιο"}
        </button>
      </form>
    </section>
  );
}
