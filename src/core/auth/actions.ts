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

function redirectWithMessage(path: string, key: "error" | "message", value: string): never {
  const params = new URLSearchParams({ [key]: value });
  redirect(`${path}?${params.toString()}`);
}

export async function login(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { email, password } = readCredentials(formData, "/login");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithMessage("/login", "error", "Δεν ήταν δυνατή η σύνδεση.");
  }

  redirect("/dashboard");
}

export async function register(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { email, password } = readCredentials(formData, "/register");

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirectWithMessage("/register", "error", "Δεν ήταν δυνατή η εγγραφή.");
  }

  redirectWithMessage(
    "/login",
    "message",
    "Η εγγραφή ολοκληρώθηκε. Μπορείτε να συνδεθείτε.",
  );
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
