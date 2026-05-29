import type { DashboardAlert } from "../types";

const toneClassNames: Record<DashboardAlert["tone"], string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  red: "border-red-200 bg-red-50 text-red-900",
  blue: "border-blue-200 bg-blue-50 text-blue-900",
};

export function DashboardAlerts({
  alerts,
}: Readonly<{
  alerts: DashboardAlert[];
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <h2 className="text-lg font-semibold text-slate-950">Ειδοποιήσεις</h2>
      <div className="mt-5 space-y-3">
        {alerts.map((alert) => (
          <p key={alert.id} className={`rounded-xl border p-4 text-sm ${toneClassNames[alert.tone]}`}>
            {alert.message}
          </p>
        ))}
        {alerts.length === 0 ? (
          <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            Δεν υπάρχουν ενεργές ειδοποιήσεις.
          </p>
        ) : null}
      </div>
    </section>
  );
}
