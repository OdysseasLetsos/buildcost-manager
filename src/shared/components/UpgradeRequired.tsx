type UpgradeRequiredProps = {
  title?: string;
  message?: string;
};

export function UpgradeRequired({
  title = "Απαιτείται αναβάθμιση",
  message = "Η λειτουργία αυτή δεν είναι διαθέσιμη στο τρέχον πακέτο σας.",
}: UpgradeRequiredProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-blue-700">Περιορισμένη πρόσβαση</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {message}
      </p>
      <button
        type="button"
        disabled
        className="mt-5 rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white opacity-60"
      >
        Αναβάθμιση Πακέτου
      </button>
    </section>
  );
}
