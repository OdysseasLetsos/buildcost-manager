"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MonthlyPeriod } from "../types";
import { MonthlyPeriodForm } from "./MonthlyPeriodForm";
import { MonthlyPeriodWorkflow } from "./MonthlyPeriodWorkflow";
import { MonthlyPeriodsTable } from "./MonthlyPeriodsTable";

export function MonthlyPeriodsPageClient({
  monthlyPeriods,
  currentMonthKey,
  canCreate,
  canManageLocks,
  featureAvailable,
}: Readonly<{
  monthlyPeriods: MonthlyPeriod[];
  currentMonthKey: string;
  canCreate: boolean;
  canManageLocks: boolean;
  featureAvailable: boolean;
}>) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const canCreateMonthlyPeriods = canCreate && featureAvailable;

  function handleCreateSuccess() {
    setShowCreateForm(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Μήνες</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Διαχείριση λογιστικών περιόδων, κλειδώματος και διορθώσεων
            παλαιότερων μηνών.
          </p>
          <p className="mt-3 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
            Τρέχων μήνας: {currentMonthKey}
          </p>
        </div>

        {canCreateMonthlyPeriods ? (
          <button
            type="button"
            onClick={() => setShowCreateForm((value) => !value)}
            className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
          >
            Νέος Μήνας
          </button>
        ) : null}
      </section>

      {!featureAvailable ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Η λειτουργία μηνών δεν είναι διαθέσιμη στο τρέχον πακέτο.
        </section>
      ) : null}

      {featureAvailable && !canCreate ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Έχετε πρόσβαση προβολής στους μήνες. Η δημιουργία επιτρέπεται μόνο σε
          ιδιοκτήτες, διαχειριστές και γραφείο.
        </section>
      ) : null}

      {featureAvailable && canCreate && !canManageLocks ? (
        <section className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          Μπορείτε να δημιουργείτε μήνες. Το κλείδωμα και το ξεκλείδωμα
          επιτρέπεται μόνο σε ιδιοκτήτες και διαχειριστές.
        </section>
      ) : null}

      <section className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        Ο τρέχων μήνας είναι ο κύριος ενεργός μήνας. Οι προηγούμενοι μήνες
        δημιουργούνται κλειδωμένοι και μπορούν να ξεκλειδωθούν προσωρινά για
        διορθώσεις. Μελλοντικοί μήνες δεν μπορούν να δημιουργηθούν ή να
        ανοίξουν πριν ξεκινήσουν ημερολογιακά.
      </section>

      <MonthlyPeriodWorkflow />

      {showCreateForm && canCreateMonthlyPeriods ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Νέος Μήνας</h3>
          <div className="mt-5">
            <MonthlyPeriodForm
              currentMonthKey={currentMonthKey}
              onSuccess={handleCreateSuccess}
            />
          </div>
        </section>
      ) : null}

      <MonthlyPeriodsTable
        monthlyPeriods={monthlyPeriods}
        currentMonthKey={currentMonthKey}
        canManageLocks={canManageLocks && featureAvailable}
      />
    </div>
  );
}
