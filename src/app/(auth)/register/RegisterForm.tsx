"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { register, signInWithGoogle } from "@/src/core/auth/actions";

const passwordPolicyMessage =
  "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες, κεφαλαίο, πεζό, αριθμό και ειδικό χαρακτήρα.";

function isPasswordValid(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Δημιουργία λογαριασμού..." : "Δημιουργία λογαριασμού"}
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
  inputRef,
  name,
}: {
  autoComplete: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  name: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        name={name}
        ref={inputRef}
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

export function RegisterForm({ nextPath }: { nextPath: string }) {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    setClientError(null);
    const password = passwordRef.current?.value ?? "";
    const confirmPassword = confirmPasswordRef.current?.value ?? "";

    if (emailRef.current) {
      emailRef.current.value = emailRef.current.value.trim().toLowerCase();
    }

    if (!isPasswordValid(password)) {
      event.preventDefault();
      setClientError(passwordPolicyMessage);
      return;
    }

    if (password !== confirmPassword) {
      event.preventDefault();
      setClientError("Οι κωδικοί δεν ταιριάζουν.");
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {clientError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {clientError}
        </p>
      ) : null}

      <form action={register} className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
          <PasswordInput
            autoComplete="new-password"
            inputRef={passwordRef}
            name="password"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Επιβεβαίωση Κωδικού
          <PasswordInput
            autoComplete="new-password"
            inputRef={confirmPasswordRef}
            name="confirmPassword"
          />
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
