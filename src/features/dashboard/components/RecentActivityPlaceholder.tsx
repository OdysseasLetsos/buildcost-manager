export function RecentActivityPlaceholder() {
  const items = [
    "Ημερήσια εργασία",
    "Πληρωμές προσωπικού",
    "Υλικά και δαπάνες",
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <h2 className="text-lg font-semibold text-slate-950">Πρόσφατες Κινήσεις</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Θα εμφανίζονται κινήσεις από ημερήσια εργασία, πληρωμές, υλικά και
        έξοδα όταν ενεργοποιηθούν τα αντίστοιχα modules.
      </p>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-blue-700" />
            <span className="text-sm font-medium text-slate-700">{item}</span>
            <span className="ml-auto text-xs text-slate-400">Σε αναμονή</span>
          </div>
        ))}
      </div>
    </section>
  );
}
