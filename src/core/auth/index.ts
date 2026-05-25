import type { User } from "@supabase/supabase-js";
import { createClient } from "@/src/integrations/supabase/server";
import { AuthenticationError } from "@/src/core/errors";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationError("You must be signed in to continue.");
  }

  return user;
}
