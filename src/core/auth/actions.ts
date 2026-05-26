"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/src/integrations/supabase/server";
import {
  getPostAuthRedirectPath,
  normalizeEmail,
  readSafeNextPath,
} from "./redirects";

function readCredentials(formData: FormData, errorPath: string) {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirectWithMessage(errorPath, "error", "Συμπληρώστε email και κωδικό.");
  }

  return { email, password };
}

function readNextPath(formData: FormData): string {
  return readSafeNextPath(String(formData.get("next") ?? ""));
}

function redirectWithMessage(path: string, key: "error" | "message", value: string): never {
  const params = new URLSearchParams({ [key]: value });
  redirect(`${path}?${params.toString()}`);
}

function logAuthError(context: string, error: unknown): void {
  console.error(`[auth:${context}] Supabase auth error`, error);
}

function isInvalidCredentialsError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "invalid_credentials" ||
    error.message?.toLowerCase().includes("invalid login credentials") === true
  );
}

export async function login(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { email, password } = readCredentials(formData, "/login");
  const nextPath = readNextPath(formData);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logAuthError("login", error);
    redirectWithMessage(
      "/login",
      "error",
      isInvalidCredentialsError(error)
        ? "Λάθος email ή κωδικός πρόσβασης. Αν μόλις κάνατε εγγραφή, ελέγξτε αν χρειάζεται επιβεβαίωση email."
        : "Δεν ήταν δυνατή η σύνδεση.",
    );
  }

  redirect(await getPostAuthRedirectPath(supabase, nextPath));
}

export async function register(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { email, password } = readCredentials(formData, "/register");
  const nextPath = readNextPath(formData);
  const origin = (await headers()).get("origin") ?? "";
  const callbackParams = new URLSearchParams({ next: nextPath });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin
        ? `${origin}/auth/callback?${callbackParams.toString()}`
        : undefined,
    },
  });

  if (error) {
    logAuthError("register", error);
    redirectWithMessage("/register", "error", "Δεν ήταν δυνατή η εγγραφή.");
  }

  if (data.session) {
    redirect(await getPostAuthRedirectPath(supabase, nextPath));
  }

  const params = new URLSearchParams({
    message: "Η εγγραφή ολοκληρώθηκε. Ελέγξτε το email σας για επιβεβαίωση.",
    next: nextPath,
  });
  redirect(`/login?${params.toString()}`);
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const email = normalizeEmail(formData.get("email"));

  if (!email) {
    redirectWithMessage(
      "/forgot-password",
      "error",
      "Συμπληρώστε το email σας.",
    );
  }

  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin}/auth/callback?next=/login` : undefined,
  });

  if (error) {
    logAuthError("password-reset", error);
    redirectWithMessage(
      "/forgot-password",
      "error",
      "Δεν ήταν δυνατή η αποστολή οδηγιών επαναφοράς.",
    );
  }

  redirectWithMessage(
    "/forgot-password",
    "message",
    "Στείλαμε οδηγίες επαναφοράς κωδικού στο email σας.",
  );
}
