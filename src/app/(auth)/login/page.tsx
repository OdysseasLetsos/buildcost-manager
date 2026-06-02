import Link from "next/link";
import { LoginForm } from "./LoginForm";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params?.next ?? "/dashboard";
  const registerHref = params?.next
    ? `/register?next=${encodeURIComponent(params.next)}`
    : "/register";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Σύνδεση</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Συνδεθείτε για να διαχειριστείτε τα έργα και τα κόστη σας.
        </p>

        {params?.message ? (
          <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {params.message}
          </p>
        ) : null}

        {params?.error ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {params.error}
          </p>
        ) : null}

        <LoginForm nextPath={nextPath} />

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href={registerHref} className="font-medium text-blue-800 hover:text-blue-950">
            Δημιουργία λογαριασμού
          </Link>
          <Link
            href="/forgot-password"
            className="font-medium text-blue-800 hover:text-blue-950"
          >
            Ξεχάσατε τον κωδικό;
          </Link>
        </div>
      </section>
    </main>
  );
}
