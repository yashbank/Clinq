import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicEnv } from "@/utils/env-public";

type RouteClientResult = {
  supabase: ReturnType<typeof createServerClient>;
  /** Merge this onto your handler response so auth cookie updates are not dropped. */
  getCookiesResponse: () => NextResponse;
};

/**
 * Supabase client for App Router Route Handlers where `cookies()` from `next/headers`
 * is not the right fit. Returns a `NextResponse` carrying `Set-Cookie` updates.
 */
export function createSupabaseRouteHandlerClient(request: NextRequest): RouteClientResult {
  let response = NextResponse.next({
    request,
  });

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getSupabasePublicEnv();

  const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return {
    supabase,
    getCookiesResponse: () => response,
  };
}
