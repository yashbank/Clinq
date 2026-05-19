import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicEnv } from "@/utils/env-public";
import { supabaseEnvDiagnosticForLog } from "@/utils/supabase-env";

/**
 * Refreshes the Supabase auth session and propagates updated cookies on the response.
 * Returns the user from `getUser()` (JWT validated) for auth routing in root middleware.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
}> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  let NEXT_PUBLIC_SUPABASE_URL: string;
  let NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  try {
    ({ NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getSupabasePublicEnv());
  } catch (e) {
    console.error(
      JSON.stringify({
        ...supabaseEnvDiagnosticForLog(),
        scope: "supabase_middleware",
        error: e instanceof Error ? e.message.slice(0, 200) : "env_invalid",
      }),
    );
    return { response: supabaseResponse, user: null };
  }

  const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
