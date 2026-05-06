import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import { buildFreelancerAuthorizeUrl } from "@/lib/integrations/freelancer/oauth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicSiteOrigin } from "@/utils/site-url";

export const runtime = "nodejs";

const STATE_COOKIE = "clinq_freelancer_oauth_state";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", "/integrations");
    return NextResponse.redirect(login);
  }

  const siteBase = getPublicSiteOrigin(new URL(request.url).origin);

  const state = randomBytes(24).toString("hex");
  const authorizeUrl = buildFreelancerAuthorizeUrl({ siteBaseUrl: siteBase, state });
  if (!authorizeUrl) {
    return NextResponse.redirect(new URL("/integrations?freelancer_error=oauth_not_configured", request.url));
  }

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
