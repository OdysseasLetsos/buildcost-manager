"use client";

import { useActionState, useEffect } from "react";
import { createMonthlyPeriod } from "../actions/create-monthly-period";
import { initialMonthlyPeriodActionState } from "../types";

export function MonthlyPeriodForm({
  onSuccess,
}: Readonly<{
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(
    createMonthlyPeriod,
    initialMonthlyPeriodActionState,
  );

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
  }, [onSuccess, state.ok]);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-[1fr_auto]">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Μήνας
        <input
          name="monthKey"
          type="month"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        />
        {state.fieldErrors?.monthKey ? (
          <span className="text-xs text-red-700">{state.fieldErrors.monthKey}</span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="self-end rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
      >
        {isPending ? "Δημιουργία..." : "Δημιουργία Μήνα"}
      </button>

      {state.message ? (
        <p
          className={`md:col-span-2 rounded-lg border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
