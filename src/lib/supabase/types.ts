/**
 * Optional: add generated database types for full type-safe queries.
 *
 * npx supabase gen types typescript --project-id <project-ref> --schema public > src/lib/supabase/database.types.ts
 *
 * Then: `export type { Database } from "./database.types";` and pass `Database`
 * as the generic to `createBrowserClient` / `createServerClient` / `createClient`.
 */
export {};
