const workflowSteps = [
  {
    title: "Καταχωρήσεις",
    description: "Συγκεντρώνονται εργασίες, πληρωμές και κόστη του μήνα.",
  },
  {
    title: "Έλεγχος",
    description: "Το γραφείο ελέγχει τις κινήσεις πριν το κλείδωμα.",
  },
  {
    title: "Κλείδωμα",
    description: "Ο μήνας προστατεύεται από αλλαγές μετά την ολοκλήρωση.",
  },
];

export function MonthlyPeriodWorkflow() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-blue-700">Ροή μήνα</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {workflowSteps.map((step, index) => (
          <article
            key={step.title}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-950 text-sm font-semibold text-white">
              {index + 1}
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-950">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
