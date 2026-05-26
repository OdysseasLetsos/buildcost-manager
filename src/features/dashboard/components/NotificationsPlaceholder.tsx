export function NotificationsPlaceholder() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <h2 className="text-lg font-semibold text-slate-950">Ειδοποιήσεις</h2>
      <div className="mt-5 space-y-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">
            Η βάση του dashboard είναι έτοιμη
          </p>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            Οι ειδοποιήσεις θα συνδεθούν με έργα, πληρωμές, υλικά, ΙΚΑ και
            εργασίες όταν υλοποιηθούν τα αντίστοιχα modules.
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          Δεν υπάρχουν ενεργές ειδοποιήσεις.
        </div>
      </div>
    </section>
  );
}
