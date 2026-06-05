import Link from "next/link";
import { getCurrentCompany } from "@/src/core/tenants";
import { requireRole } from "@/src/core/roles";
import { LanguageSettingsSection } from "@/src/shared/i18n";

export default async function SettingsPage() {
  const currentCompany = await getCurrentCompany();
  let canManageMembers = false;

  if (currentCompany) {
    try {
      await requireRole(currentCompany.company.id, ["owner", "admin"]);
      canManageMembers = true;
    } catch {
      canManageMembers = false;
    }
  }

  return (
    <div className="space-y-6">
      <LanguageSettingsSection />

      {canManageMembers ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            Μέλη εταιρείας
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Διαχειριστείτε προσκλήσεις, ρόλους και πρόσβαση μελών.
          </p>
          <Link
            href="/settings/members"
            className="mt-4 inline-flex rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
          >
            Διαχείριση μελών
          </Link>
        </section>
      ) : null}
    </div>
  );
}
