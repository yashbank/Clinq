"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nullishToUndef, zNullableTrimmedString, zStringArray } from "@/lib/zod/form-coercion";
import { isSupportedDisplayCurrency } from "@/types/currency";

const profileSchema = z.object({
  display_name: zNullableTrimmedString(120),
  bio: zNullableTrimmedString(4_000),
  website_url: zNullableTrimmedString(2000),
  resume_text: zNullableTrimmedString(48_000),
  resume_filename: zNullableTrimmedString(255),
  skills: zStringArray(80, 80),
  tech_stack: zStringArray(80, 80),
  portfolio_links: zStringArray(20, 2000),
  linkedin_url: zNullableTrimmedString(2000),
  github_url: zNullableTrimmedString(2000),
  experience_level: z
    .preprocess(nullishToUndef, z.union([z.string(), z.null(), z.undefined()]).optional())
    .transform((s) => {
      if (s == null || typeof s !== "string") return null;
      const v = s.trim();
      if (!v) return null;
      if (v === "junior" || v === "mid" || v === "senior" || v === "lead") return v;
      return null;
    }),
  niches: zStringArray(40, 80),
  preferred_currency: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      const raw = v == null || String(v).trim() === "" ? "USD" : String(v).trim().toUpperCase();
      return isSupportedDisplayCurrency(raw) ? raw : "USD";
    }),
  markComplete: z.boolean().optional(),
});

export type UpdateFreelancerProfileInput = z.infer<typeof profileSchema>;

export async function updateFreelancerProfileAction(
  raw: UpdateFreelancerProfileInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const v = parsed.data;
  const experience_level = v.experience_level ?? null;

  const patch: Record<string, unknown> = {
    display_name: v.display_name?.trim() || null,
    bio: v.bio?.trim() || null,
    website_url: v.website_url?.trim() || null,
    resume_text: v.resume_text?.trim() || null,
    resume_filename: v.resume_filename?.trim() || null,
    skills: v.skills.map((s) => s.trim()).filter(Boolean),
    tech_stack: v.tech_stack.map((s) => s.trim()).filter(Boolean),
    portfolio_links: v.portfolio_links.map((s) => s.trim()).filter(Boolean),
    linkedin_url: v.linkedin_url?.trim() || null,
    github_url: v.github_url?.trim() || null,
    experience_level: experience_level ?? null,
    niches: v.niches.map((s) => s.trim()).filter(Boolean),
  };

  patch.preferred_currency = v.preferred_currency;

  if (v.markComplete === true) {
    patch.profile_onboarding_completed_at = new Date().toISOString();
  } else if (v.markComplete === false) {
    patch.profile_onboarding_completed_at = null;
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/proposals");
  revalidatePath("/leads");
  revalidatePath("/settings");
  revalidatePath("/pipeline");
  revalidatePath("/analytics");
  return { ok: true };
}

export async function updatePreferredCurrencyAction(
  currency: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupportedDisplayCurrency(currency)) {
    return { ok: false, error: "Unsupported currency" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { error } = await supabase.from("profiles").update({ preferred_currency: currency }).eq("id", user.id);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  revalidatePath("/integrations");
  revalidatePath("/integrations/scraped");
  revalidatePath("/proposals");
  revalidatePath("/analytics");
  return { ok: true };
}

/** Sets onboarding timestamp only — does not change profile fields. */
export async function markProfileOnboardingCompleteAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ profile_onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/leads");
  revalidatePath("/settings");
  return { ok: true };
}
