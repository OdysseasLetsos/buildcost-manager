"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/src/integrations/supabase/server";

function readCredentials(formData: FormData, errorPath: string) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirectWithMessage(errorPath, "error", "Συμπληρώστε email και κωδικό.");
  }

  return { email, password };
}

function readSafeNextPath(formData: FormData): string {
  const nextPath = String(formData.get("next") ?? "").trim();

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

function redirectWithMessage(path: string, key: "error" | "message", value: string): never {
  const params = new URLSearchParams({ [key]: value });
  redirect(`${path}?${params.toString()}`);
}

function logAuthError(context: string, error: unknown): void {
  console.error(`[auth:${context}] Supabase auth error`, error);
}

export async function login(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { email, password } = readCredentials(formData, "/login");
  const nextPath = readSafeNextPath(formData);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logAuthError("login", error);
    redirectWithMessage("/login", "error", "Δεν ήταν δυνατή η σύνδεση.");
  }

  redirect(nextPath);
}

export async function register(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { email, password } = readCredentials(formData, "/register");
  const nextPath = readSafeNextPath(formData);

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    logAuthError("register", error);
    redirectWithMessage("/register", "error", "Δεν ήταν δυνατή η εγγραφή.");
  }

  const params = new URLSearchParams({
    message: "Η εγγραφή ολοκληρώθηκε. Μπορείτε να συνδεθείτε.",
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
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirectWithMessage(
      "/forgot-password",
      "error",
      "Συμπληρώστε το email σας.",
    );
  }

  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin}/login` : undefined,
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
