"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { login, signInWithGoogle } from "@/src/core/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Σύνδεση..." : "Σύνδεση"}
    </button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Σύνδεση..." : "Συνέχεια με Google"}
    </button>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      {hidden ? <path d="M4 4l16 16" /> : null}
    </svg>
  );
}

function PasswordInput({
  autoComplete,
  name,
}: {
  autoComplete: string;
  name: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        name={name}
        required
        type={visible ? "text" : "password"}
      />
      <button
        aria-label={visible ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}
        className="absolute inset-y-0 right-2 flex items-center rounded-md px-2 text-slate-500 transition hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
        onClick={() => setVisible((value) => !value)}
        type="button"
      >
        <EyeIcon hidden={!visible} />
      </button>
    </div>
  );
}

export function LoginForm({ nextPath }: { nextPath: string }) {
  const emailRef = useRef<HTMLInputElement>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit() {
    setClientError(null);
    if (emailRef.current) {
      emailRef.current.value = emailRef.current.value.trim().toLowerCase();
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {clientError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {clientError}
        </p>
      ) : null}

      <form action={login} className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input name="next" type="hidden" value={nextPath} />

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Email
          <input
            autoComplete="email"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            name="email"
            ref={emailRef}
            required
            type="email"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Κωδικός Πρόσβασης
          <PasswordInput autoComplete="current-password" name="password" />
        </label>

        <SubmitButton />
      </form>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />ή
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={signInWithGoogle}>
        <input name="next" type="hidden" value={nextPath} />
        <GoogleButton />
      </form>
    </div>
  );
}
