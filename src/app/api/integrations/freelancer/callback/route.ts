import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { completeFreelancerConnection } from "@/lib/integrations/freelancer/complete-freelancer-connection";
import { mapTokenPersistenceErrorForUser } from "@/lib/integrations/freelancer/save-freelancer-token-server-side";
import { exchangeFreelancerAuthorizationCode } from "@/lib/integrations/freelancer/oauth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseServiceRoleKey } from "@/utils/env-server";
import { getPublicSiteOrigin } from "@/utils/site-url";

export const runtime = "nodejs";

const STATE_COOKIE = "clinq_freelancer_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthErr = url.searchParams.get("error");

  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value;

  if (oauthErr) {
    const r = NextResponse.redirect(new URL(`/integrations?freelancer_error=${encodeURIComponent(oauthErr)}`, request.url));
    r.cookies.delete(STATE_COOKIE);
    return r;
  }

  if (!code || !state || !expected || state !== expected) {
    const r = NextResponse.redirect(new URL("/integrations?freelancer_error=invalid_oauth_state", request.url));
    r.cookies.delete(STATE_COOKIE);
    return r;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const r = NextResponse.redirect(new URL("/login?next=/integrations", request.url));
    r.cookies.delete(STATE_COOKIE);
    return r;
  }

  if (!hasSupabaseServiceRoleKey()) {
    const r = NextResponse.redirect(
      new URL("/integrations?freelancer_error=server_misconfigured_missing_service_role", request.url),
    );
    r.cookies.delete(STATE_COOKIE);
    return r;
  }

  const siteBase = getPublicSiteOrigin(new URL(request.url).origin);

  const exchanged = await exchangeFreelancerAuthorizationCode({ siteBaseUrl: siteBase, code });
  if (!exchanged.ok) {
    const r = NextResponse.redirect(
      new URL(`/integrations?freelancer_error=${encodeURIComponent(exchanged.error)}`, request.url),
    );
    r.cookies.delete(STATE_COOKIE);
    return r;
  }

  const conn = await completeFreelancerConnection(user.id, exchanged.tokens, { connectionKind: "oauth2" });
  if (!conn.ok) {
    const r = NextResponse.redirect(
      new URL(`/integrations?freelancer_error=${encodeURIComponent(mapTokenPersistenceErrorForUser(conn.error))}`, request.url),
    );
    r.cookies.delete(STATE_COOKIE);
    return r;
  }

  const ok = NextResponse.redirect(new URL("/integrations?freelancer=connected", request.url));
  ok.cookies.delete(STATE_COOKIE);
  return ok;
}
