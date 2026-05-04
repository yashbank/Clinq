import "server-only";

import { z } from "zod";

const openAISchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is empty"),
});

/**
 * OpenAI / ChatGPT API key. Server-only — never import this module from client components.
 */
export function getOpenAIApiKey(): string {
  const parsed = openAISchema.safeParse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(
      `Missing or invalid OpenAI environment (${msg}). Set OPENAI_API_KEY in .env.local (server-only; not NEXT_PUBLIC_*).`,
    );
  }
  return parsed.data.OPENAI_API_KEY;
}

const serviceRoleSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "service role key looks too short"),
});

/**
 * Service role key for privileged server jobs only. Never expose to the client.
 */
export function getSupabaseServiceRoleKey(): string {
  const parsed = serviceRoleSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(
      `Missing or invalid SUPABASE_SERVICE_ROLE_KEY (${msg}). Required for admin client usage.`,
    );
  }
  return parsed.data.SUPABASE_SERVICE_ROLE_KEY;
}

export function hasSupabaseServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
