"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/src/integrations/supabase/server";
import {
  getPostAuthRedirectPath,
  normalizeEmail,
  readSafeNextPath,
} from "./redirects";

const rateLimitMessage =
  "Πάρα πολλά αιτήματα. Παρακαλώ περιμένετε λίγο και δοκιμάστε ξανά.";

const passwordPolicyMessage =
  "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες, κεφαλαίο, πεζό, αριθμό και ειδικό χαρακτήρα.";

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

async function getRequestOrigin(): Promise<string> {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "";
}

function isInvalidCredentialsError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "invalid_credentials" ||
    error.message?.toLowerCase().includes("invalid login credentials") === true
  );
}

function isRateLimitError(error: {
  code?: string;
  message?: string;
  status?: number;
}): boolean {
  return (
    error.code === "over_request_rate_limit" ||
    error.status === 429 ||
    error.message?.toLowerCase().includes("request rate limit") === true
  );
}

function isPasswordValid(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);
}

function mapRegisterError(error: { code?: string; message?: string }): string {
  const message = error.message?.toLowerCase() ?? "";

  if (isRateLimitError(error)) {
    return rateLimitMessage;
  }

  if (error.code === "over_email_send_rate_limit") {
    return "Πάρα πολλά αιτήματα. Παρακαλώ περιμένετε λίγο και δοκιμάστε ξανά.";
  }

  if (error.code === "user_already_exists" || message.includes("already registered")) {
    return "Υπάρχει ήδη λογαριασμός με αυτό το email.";
  }

  if (
    message.includes("password") &&
    (message.includes("weak") ||
      message.includes("security") ||
      message.includes("characters") ||
      message.includes("requirements"))
  ) {
    return error.message && error.message.length < 180
      ? error.message
      : "Ο κωδικός πρόσβασης δεν πληροί τις απαιτήσεις ασφαλείας.";
  }

  return "Δεν ήταν δυνατή η εγγραφή. Παρακαλώ δοκιμάστε ξανά.";
}

function mapLoginError(error: { code?: string; message?: string }): string {
  if (isRateLimitError(error)) {
    return rateLimitMessage;
  }

  if (isInvalidCredentialsError(error)) {
    return "Λάθος email ή κωδικός πρόσβασης. Αν μόλις κάνατε εγγραφή, ελέγξτε αν χρειάζεται επιβεβαίωση email.";
  }

  return "Δεν ήταν δυνατή η σύνδεση. Παρακαλώ δοκιμάστε ξανά.";
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
    redirectWithMessage("/login", "error", mapLoginError(error));
  }

  redirect(await getPostAuthRedirectPath(supabase, nextPath));
}

export async function register(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { email, password } = readCredentials(formData, "/register");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const nextPath = readNextPath(formData);
  const origin = await getRequestOrigin();
  const callbackParams = new URLSearchParams({ next: nextPath });

  if (!isPasswordValid(password)) {
    redirectWithMessage("/register", "error", passwordPolicyMessage);
  }

  if (password !== confirmPassword) {
    redirectWithMessage("/register", "error", "Οι κωδικοί δεν ταιριάζουν.");
  }

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
    redirectWithMessage("/register", "error", mapRegisterError(error));
  }

  if (data.session) {
    redirect(await getPostAuthRedirectPath(supabase, nextPath));
  }

  const params = new URLSearchParams({
    message:
      "Ο λογαριασμός δημιουργήθηκε! Παρακαλώ ελέγξτε το email σας για επιβεβαίωση.",
    next: nextPath,
  });
  redirect(`/login?${params.toString()}`);
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const nextPath = readNextPath(formData);
  const origin = await getRequestOrigin();
  const callbackParams = new URLSearchParams({ next: nextPath });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: origin
        ? `${origin}/auth/callback?${callbackParams.toString()}`
        : undefined,
    },
  });

  if (error || !data.url) {
    logAuthError("google-oauth", error);
    redirectWithMessage(
      "/login",
      "error",
      error && isRateLimitError(error)
        ? rateLimitMessage
        : "Δεν ήταν δυνατή η σύνδεση με Google. Παρακαλώ δοκιμάστε ξανά.",
    );
  }

  redirect(data.url);
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

  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin}/auth/callback?next=/login` : undefined,
  });

  if (error) {
    logAuthError("password-reset", error);
    redirectWithMessage(
      "/forgot-password",
      "error",
      isRateLimitError(error)
        ? rateLimitMessage
        : "Δεν ήταν δυνατή η αποστολή οδηγιών επαναφοράς.",
    );
  }

  redirectWithMessage(
    "/forgot-password",
    "message",
    "Στείλαμε οδηγίες επαναφοράς κωδικού στο email σας.",
  );
}
