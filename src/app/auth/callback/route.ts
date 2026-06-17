import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthRedirectPath, readSafeNextPath } from "@/src/core/auth/redirects";
import { createClient } from "@/src/integrations/supabase/server";

const invalidLinkMessage =
  "Ο σύνδεσμος σύνδεσης έχει λήξει ή δεν είναι έγκυρος.";

function redirectToLoginWithError(request: NextRequest, message: string): NextResponse {
  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("error", message);

  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const authError = requestUrl.searchParams.get("error");
  const authErrorCode = requestUrl.searchParams.get("error_code");
  const nextPath = readSafeNextPath(requestUrl.searchParams.get("next"));

  if (authError || authErrorCode) {
    console.error("[auth:callback] Supabase auth callback error", {
      error: authError,
      errorCode: authErrorCode,
      description: requestUrl.searchParams.get("error_description"),
    });

    return redirectToLoginWithError(request, invalidLinkMessage);
  }

  if (!code) {
    return redirectToLoginWithError(request, invalidLinkMessage);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth:callback] Supabase code exchange error", {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    return redirectToLoginWithError(request, invalidLinkMessage);
  }

  const redirectPath = await getPostAuthRedirectPath(supabase, nextPath);
  return NextResponse.redirect(new URL(redirectPath, request.url));
}
