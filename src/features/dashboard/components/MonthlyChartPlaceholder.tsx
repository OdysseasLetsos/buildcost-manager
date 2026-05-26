export function MonthlyChartPlaceholder() {
  const bars = [38, 64, 48, 76, 58, 84, 68, 72];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Μηνιαία Εικόνα
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Προσωρινό γράφημα μέχρι να συνδεθούν έσοδα, έξοδα, πληρωμές,
            υλικά, ημερήσια εργασία και ΙΚΑ.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          Placeholder
        </span>
      </div>

      <div className="mt-8 flex h-52 items-end gap-3 rounded-2xl bg-gradient-to-b from-slate-50 to-white p-4">
        {bars.map((height, index) => (
          <div
            key={`${height}-${index}`}
            className="flex flex-1 items-end rounded-full bg-blue-100"
          >
            <div
              className="w-full rounded-full bg-gradient-to-t from-blue-950 to-blue-600"
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
