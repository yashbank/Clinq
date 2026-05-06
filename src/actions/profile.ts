"use server";

import { revalidatePath } from "next/cache";

import { freelancerProfileUpdateSchema, type FreelancerProfileUpdateParsed } from "@/lib/profile/profile-update-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupportedDisplayCurrency } from "@/types/currency";

export type UpdateFreelancerProfileInput = FreelancerProfileUpdateParsed;

export async function updateFreelancerProfileAction(
  raw: UpdateFreelancerProfileInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = freelancerProfileUpdateSchema.safeParse(raw);
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
    display_name: v.display_name,
    bio: v.bio,
    website_url: v.website_url,
    resume_text: v.resume_text,
    resume_filename: v.resume_filename,
    skills: v.skills.map((s) => s.trim()).filter(Boolean),
    tech_stack: v.tech_stack.map((s) => s.trim()).filter(Boolean),
    portfolio_links: v.portfolio_links.map((s) => s.trim()).filter(Boolean),
    linkedin_url: v.linkedin_url,
    github_url: v.github_url,
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
