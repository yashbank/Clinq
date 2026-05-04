import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnv } from "@/utils/env-public";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers
 * that use `cookies()` from `next/headers`.
 *
 * Cookie writes can throw in some Server Component contexts; middleware handles
 * session refresh — see `src/lib/supabase/middleware.ts`.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getSupabasePublicEnv();

  return createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always set cookies; middleware refreshes session.
        }
      },
    },
  });
}
