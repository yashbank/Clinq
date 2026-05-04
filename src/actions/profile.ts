"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
const profileSchema = z.object({
  display_name: z.string().max(120).nullable().optional(),
  resume_text: z.string().max(48_000).nullable().optional(),
  resume_filename: z.string().max(255).nullable().optional(),
  skills: z.array(z.string().max(80)).max(80),
  tech_stack: z.array(z.string().max(80)).max(80),
  portfolio_links: z.array(z.string().max(2000)).max(20),
  linkedin_url: z.string().max(2000).optional(),
  github_url: z.string().max(2000).optional(),
  experience_level: z
    .string()
    .max(20)
    .optional()
    .transform((s) => {
      if (!s || s.trim() === "") return null;
      const v = s.trim();
      if (v === "junior" || v === "mid" || v === "senior" || v === "lead") return v;
      return null;
    }),
  niches: z.array(z.string().max(80)).max(40),
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

  patch.profile_onboarding_completed_at = v.markComplete ? new Date().toISOString() : null;

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/proposals");
  revalidatePath("/leads");
  return { ok: true };
}
