export function EmployeeStatusBadge({
  active,
}: Readonly<{
  active: boolean;
}>) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {active ? "Ενεργός" : "Ανενεργός"}
    </span>
  );
}
