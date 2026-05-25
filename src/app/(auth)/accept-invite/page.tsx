import Link from "next/link";
import { getCurrentUser } from "@/src/core/auth";
import { acceptInvitation } from "@/src/core/tenants";

type AcceptInvitePageProps = {
  searchParams?: Promise<{
    token?: string;
    error?: string;
  }>;
};

export default async function AcceptInvitePage({
  searchParams,
}: AcceptInvitePageProps) {
  const params = await searchParams;
  const token = params?.token ?? "";
  const user = await getCurrentUser();
  const nextPath = `/accept-invite?token=${encodeURIComponent(token)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          Αποδοχή πρόσκλησης
        </h1>

        {params?.error ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {params.error}
          </p>
        ) : null}

        {!token ? (
          <p className="mt-5 text-sm leading-6 text-slate-600">
            Ο σύνδεσμος πρόσκλησης δεν είναι έγκυρος.
          </p>
        ) : null}

        {token && !user ? (
          <div className="mt-5 space-y-5">
            <p className="text-sm leading-6 text-slate-600">
              Για να αποδεχθείτε την πρόσκληση, συνδεθείτε ή δημιουργήστε
              λογαριασμό.
            </p>
            <div className="flex gap-3">
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
              >
                Σύνδεση
              </Link>
              <Link
                href={`/register?next=${encodeURIComponent(nextPath)}`}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Δημιουργία λογαριασμού
              </Link>
            </div>
          </div>
        ) : null}

        {token && user ? (
          <form action={acceptInvitation} className="mt-6">
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
            >
              Αποδοχή πρόσκλησης
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
