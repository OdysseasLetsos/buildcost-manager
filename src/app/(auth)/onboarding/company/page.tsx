import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, logout } from "@/src/core/auth";
import {
  createCompany,
  getCurrentCompany,
  openInvitation,
} from "@/src/core/tenants";

type CompanyOnboardingPageProps = {
  searchParams?: Promise<{
    error?: string;
    mode?: string;
  }>;
};

export default async function CompanyOnboardingPage({
  searchParams,
}: CompanyOnboardingPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const currentCompany = await getCurrentCompany();

  if (currentCompany) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const showCreateForm = params?.mode === "create";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <section className="mx-auto w-full max-w-5xl">
        <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Πρόσβαση σε εταιρεία
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Επιλέξτε πώς θέλετε να συνδεθείτε με μια εταιρεία. Αν ξεκινάτε νέα
          εταιρεία, μπορείτε να τη δημιουργήσετε. Αν σας έχει σταλεί πρόσκληση,
          αποδεχθείτε την με τον σύνδεσμο ή το token.
        </p>

        {params?.error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {params.error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Δημιουργία νέας εταιρείας
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Για ιδιοκτήτες ή διαχειριστές που ξεκινούν μια νέα εταιρεία στο
              BuildCost Manager.
            </p>
            <Link
              href="/onboarding/company?mode=create"
              className="mt-5 inline-flex rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
            >
              Δημιουργία νέας εταιρείας
            </Link>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Έχω πρόσκληση
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Επικολλήστε το token πρόσκλησης ή ανοίξτε τον σύνδεσμο που σας
              έστειλε ο διαχειριστής.
            </p>
            <form action={openInvitation} className="mt-5 flex flex-col gap-3">
              <input
                name="token"
                type="text"
                placeholder="Token πρόσκλησης"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Άνοιγμα πρόσκλησης
              </button>
            </form>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Αναμονή πρόσκλησης
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Δεν ανήκετε ακόμα σε κάποια εταιρεία. Ζητήστε από τον
              διαχειριστή σας να σας στείλει πρόσκληση.
            </p>
            <form action={logout} className="mt-5">
              <button
                type="submit"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Αποσύνδεση
              </button>
            </form>
          </article>
        </div>

        {showCreateForm ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Δημιουργία Εταιρείας
            </h2>
            <form action={createCompany} className="mt-5 flex max-w-xl flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Όνομα εταιρείας
                <input
                  name="name"
                  type="text"
                  autoComplete="organization"
                  required
                  className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <button
                type="submit"
                className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
              >
                Δημιουργία Εταιρείας
              </button>
            </form>
          </section>
        ) : null}
      </section>
    </main>
  );
}
