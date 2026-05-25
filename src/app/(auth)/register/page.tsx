import Link from "next/link";
import { register } from "@/src/core/auth";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Εγγραφή</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Δημιουργήστε λογαριασμό για να ξεκινήσετε τη διαχείριση κόστους.
        </p>

        {params?.error ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {params.error}
          </p>
        ) : null}

        <form action={register} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Κωδικός
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
          >
            Δημιουργία λογαριασμού
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Έχετε ήδη λογαριασμό;{" "}
          <Link href="/login" className="font-medium text-blue-800 hover:text-blue-950">
            Σύνδεση
          </Link>
        </p>
      </section>
    </main>
  );
}
