import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const nextPath = params?.next ?? "/dashboard";
  const loginHref = params?.next
    ? `/login?next=${encodeURIComponent(params.next)}`
    : "/login";

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

        {params?.message ? (
          <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {params.message}
          </p>
        ) : null}

        <RegisterForm nextPath={nextPath} />

        <p className="mt-6 text-sm text-slate-600">
          Έχετε ήδη λογαριασμό;{" "}
          <Link href={loginHref} className="font-medium text-blue-800 hover:text-blue-950">
            Σύνδεση
          </Link>
        </p>
      </section>
    </main>
  );
}
