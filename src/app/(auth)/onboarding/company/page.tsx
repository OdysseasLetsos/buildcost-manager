import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/core/auth";
import { createCompany, getCurrentCompany } from "@/src/core/tenants";

type CompanyOnboardingPageProps = {
  searchParams?: Promise<{
    error?: string;
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          Δημιουργία Εταιρείας
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Δημιουργήστε την πρώτη εταιρεία για να ξεκινήσετε τη διαχείριση
          κόστους.
        </p>

        {params?.error ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {params.error}
          </p>
        ) : null}

        <form action={createCompany} className="mt-6 flex flex-col gap-4">
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
            className="mt-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
          >
            Δημιουργία Εταιρείας
          </button>
        </form>
      </section>
    </main>
  );
}
