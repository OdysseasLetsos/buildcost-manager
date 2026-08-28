const steps = [
  "Upload αρχείου",
  "Ανάλυση στοιχείων",
  "Δημιουργία εγγραφής ελέγχου",
  "Έλεγχος από χρήστη",
];

export function InvoiceAnalysisSteps() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">Βήματα AI ανάλυσης</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step}
            className="rounded-xl border border-blue-100 bg-blue-50/60 p-3"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-950 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-800">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
