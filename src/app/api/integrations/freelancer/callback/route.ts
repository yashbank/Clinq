import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { exchangeFreelancerAuthorizationCode } from "@/lib/integrations/freelancer/oauth";
import { upsertFreelancerTokensForUser } from "@/lib/integrations/freelancer/token-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  const tok = await upsertFreelancerTokensForUser(user.id, exchanged.tokens);
  if (!tok.ok) {
    const r = NextResponse.redirect(new URL(`/integrations?freelancer_error=${encodeURIComponent(tok.error)}`, request.url));
    r.cookies.delete(STATE_COOKIE);
    return r;
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error: accErr } = await admin.from("integration_accounts").upsert(
    {
      user_id: user.id,
      provider: "freelancer",
      status: "connected",
      meta: {
        oauth_connected_at: now,
        connection_kind: "oauth2",
      },
      credentials: {
        version: 1,
        storage: "integration_oauth_tokens",
      },
      sync_status: "idle",
      updated_at: now,
    },
    { onConflict: "user_id,provider" },
  );

  if (accErr) {
    const r = NextResponse.redirect(new URL(`/integrations?freelancer_error=${encodeURIComponent(accErr.message)}`, request.url));
    r.cookies.delete(STATE_COOKIE);
    return r;
  }

  const ok = NextResponse.redirect(new URL("/integrations?freelancer=connected", request.url));
  ok.cookies.delete(STATE_COOKIE);
  return ok;
}
