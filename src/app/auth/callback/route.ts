import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { safeNextPath } from "@/lib/auth/safe-next-path";
import { getSupabasePublicEnv } from "@/utils/env-public";

export const dynamic = "force-dynamic";

function loginRedirect(origin: string, kind: "auth" | "otp_expired") {
  return NextResponse.redirect(new URL(`/login?error=${kind}`, origin));
}

/**
 * OAuth / magic-link / recovery: exchange must attach Set-Cookie to the same Response as the redirect.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const origin = url.origin;

  const oauthError = url.searchParams.get("error");
  const oauthDesc = (url.searchParams.get("error_description") ?? "").replace(/\+/g, " ");
  if (oauthError || oauthDesc) {
    const expired =
      /expired|otp|invalid.*code|flow_state/i.test(`${oauthError} ${oauthDesc}`) ||
      oauthError === "access_denied";
    return loginRedirect(origin, expired ? "otp_expired" : "auth");
  }

  const code = url.searchParams.get("code");
  const nextPath = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    return loginRedirect(origin, "auth");
  }

  const target = new URL(nextPath, origin);
  const response = NextResponse.redirect(target);

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getSupabasePublicEnv();

  const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const expired = /expired|otp|invalid|flow_state|already been used/i.test(error.message);
    return loginRedirect(origin, expired ? "otp_expired" : "auth");
  }

  return response;
}
