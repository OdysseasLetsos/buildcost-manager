const statusLabels: Record<string, string> = {
  pending: "Εκκρεμεί",
  paid: "Πληρωμένο",
};

const statusClassNames: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function MaterialPaymentStatusBadge({
  status,
}: Readonly<{
  status: string;
}>) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClassNames[status] ?? "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
