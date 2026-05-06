"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { ClinqLogo } from "@/components/brand/clinq-logo";
import { ResumeUploadZone } from "@/components/profile/resume-upload-zone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  markProfileOnboardingCompleteAction,
  updateFreelancerProfileAction,
} from "@/actions/profile";
import { refreshProfileIntelligenceAction } from "@/actions/profile-intelligence";
import type { FreelancerProfileFields } from "@/types/profile";
import { isSupportedDisplayCurrency } from "@/types/currency";

const STEP_KEY = "clinq_onboarding_step_v1";
const TOTAL = 8;

function splitTags(s: string) {
  return s
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function splitLines(s: string) {
  return s
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function mergeGoalsIntoBio(bio: string, goals: string) {
  const g = goals.trim();
  const stripped = bio.replace(/\n\nFocus areas:[\s\S]*$/i, "").trim();
  if (!g) return stripped || null;
  return stripped ? `${stripped}\n\nFocus areas: ${g}` : `Focus areas: ${g}`;
}

export function OnboardingWizard({ initial }: { initial: FreelancerProfileFields }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [displayName, setDisplayName] = useState(initial.display_name ?? "");
  const [bodyBio, setBodyBio] = useState(() => {
    const b = initial.bio ?? "";
    return b.replace(/\n\nFocus areas:[\s\S]*$/i, "").trim();
  });
  const [skillsStr, setSkillsStr] = useState((initial.skills ?? []).join(", "));
  const [nichesStr, setNichesStr] = useState((initial.niches ?? []).join(", "));
  const [experience, setExperience] = useState(initial.experience_level ?? "");
  const [resumeText, setResumeText] = useState(initial.resume_text ?? "");
  const [resumeFilename, setResumeFilename] = useState(initial.resume_filename ?? "");
  const [portfolioLines, setPortfolioLines] = useState((initial.portfolio_links ?? []).join("\n"));
  const [linkedin, setLinkedin] = useState(initial.linkedin_url ?? "");
  const [github, setGithub] = useState(initial.github_url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial.website_url ?? "");
  const [focusGoals, setFocusGoals] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STEP_KEY);
      const n = raw ? parseInt(raw, 10) : 0;
      if (!Number.isNaN(n) && n >= 0 && n < TOTAL) setStep(n);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STEP_KEY, String(step));
    } catch {
      /* ignore */
    }
  }, [step]);

  const persist = useCallback(async () => {
    return updateFreelancerProfileAction({
      preferred_currency: isSupportedDisplayCurrency(initial.preferred_currency ?? "")
        ? (initial.preferred_currency as "USD" | "INR" | "GBP" | "CAD" | "EUR")
        : "USD",
      display_name: displayName.trim() || null,
      bio: mergeGoalsIntoBio(bodyBio, focusGoals),
      website_url: websiteUrl.trim() || null,
      resume_text: resumeText.trim() || null,
      resume_filename: resumeFilename.trim() || null,
      skills: splitTags(skillsStr),
      tech_stack: initial.tech_stack ?? [],
      niches: splitTags(nichesStr),
      portfolio_links: splitLines(portfolioLines),
      linkedin_url: linkedin.trim() || undefined,
      github_url: github.trim() || undefined,
      experience_level: experience ? (experience as "junior" | "mid" | "senior" | "lead") : null,
    });
  }, [
    bodyBio,
    displayName,
    experience,
    focusGoals,
    github,
    initial.preferred_currency,
    initial.tech_stack,
    linkedin,
    nichesStr,
    portfolioLines,
    resumeFilename,
    resumeText,
    skillsStr,
    websiteUrl,
  ]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(() => {
        void (async () => {
          const res = await updateFreelancerProfileAction({
            preferred_currency: isSupportedDisplayCurrency(initial.preferred_currency ?? "")
              ? (initial.preferred_currency as "USD" | "INR" | "GBP" | "CAD" | "EUR")
              : "USD",
            display_name: displayName.trim() || null,
            bio: mergeGoalsIntoBio(bodyBio, focusGoals),
            website_url: websiteUrl.trim() || null,
            resume_text: resumeText.trim() || null,
            resume_filename: resumeFilename.trim() || null,
            skills: splitTags(skillsStr),
            tech_stack: initial.tech_stack ?? [],
            niches: splitTags(nichesStr),
            portfolio_links: splitLines(portfolioLines),
            linkedin_url: linkedin.trim() || undefined,
            github_url: github.trim() || undefined,
            experience_level: experience ? (experience as "junior" | "mid" | "senior" | "lead") : null,
          });
          if (!res.ok) toast.error(res.error);
        })();
      });
    }, 700);
  }, [
    bodyBio,
    displayName,
    experience,
    focusGoals,
    github,
    initial.preferred_currency,
    initial.tech_stack,
    linkedin,
    nichesStr,
    portfolioLines,
    resumeFilename,
    resumeText,
    skillsStr,
    websiteUrl,
  ]);

  useEffect(() => {
    if (step === 0) return;
    scheduleSave();
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    step,
    scheduleSave,
    displayName,
    bodyBio,
    skillsStr,
    nichesStr,
    experience,
    resumeText,
    resumeFilename,
    portfolioLines,
    linkedin,
    github,
    websiteUrl,
    focusGoals,
  ]);

  const finish = () => {
    startTransition(() => {
      void (async () => {
        const res = await updateFreelancerProfileAction({
          preferred_currency: isSupportedDisplayCurrency(initial.preferred_currency ?? "")
            ? (initial.preferred_currency as "USD" | "INR" | "GBP" | "CAD" | "EUR")
            : "USD",
          display_name: displayName.trim() || null,
          bio: mergeGoalsIntoBio(bodyBio, focusGoals),
          website_url: websiteUrl.trim() || null,
          resume_text: resumeText.trim() || null,
          resume_filename: resumeFilename.trim() || null,
          skills: splitTags(skillsStr),
          tech_stack: initial.tech_stack ?? [],
          niches: splitTags(nichesStr),
          portfolio_links: splitLines(portfolioLines),
          linkedin_url: linkedin.trim() || undefined,
          github_url: github.trim() || undefined,
          experience_level: experience ? (experience as "junior" | "mid" | "senior" | "lead") : null,
          markComplete: true,
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        await refreshProfileIntelligenceAction().catch(() => null);
        try {
          localStorage.removeItem(STEP_KEY);
        } catch {
          /* ignore */
        }
        toast.success("You’re set. Dashboard is next.");
        router.push("/dashboard");
        router.refresh();
      })();
    });
  };

  const skipAll = () => {
    startTransition(() => {
      void (async () => {
        const saveRes = await persist();
        if (!saveRes.ok) {
          toast.error(saveRes.error);
          return;
        }
        const res = await markProfileOnboardingCompleteAction();
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        try {
          localStorage.removeItem(STEP_KEY);
        } catch {
          /* ignore */
        }
        router.push("/dashboard");
        router.refresh();
      })();
    });
  };

  const pct = Math.round(((step + 1) / TOTAL) * 100);

  return (
    <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-lg flex-col px-4 py-10 sm:py-14">
      <div className="mb-8 flex items-center justify-between gap-4">
        <ClinqLogo width={44} height={44} priority className="h-11 w-11 shrink-0" />
        <button
          type="button"
          onClick={skipAll}
          disabled={pending}
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip for now
        </button>
      </div>

      <div className="mb-6 h-1 overflow-hidden rounded-full bg-muted/40">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="auth-card flex flex-1 flex-col">
        <div
          key={step}
          className="flex flex-1 flex-col animate-fade-in"
        >
          {step === 0 ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Welcome</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Set up your workspace</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                A short guided pass so Clinq can score leads and tailor proposals to how you actually work. Everything
                saves as you go.
              </p>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">How should we refer to you?</h1>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ob_name">Display name</Label>
                  <Input
                    id="ob_name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Rivera"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob_bio">One-line positioning</Label>
                  <Textarea
                    id="ob_bio"
                    value={bodyBio}
                    onChange={(e) => setBodyBio(e.target.value)}
                    placeholder="e.g. Product designer for B2B SaaS — systems, research, delivery."
                    rows={3}
                    className="min-h-[88px] resize-none"
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Skills</p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">What do you ship with?</h1>
              <p className="mt-2 text-sm text-muted-foreground">Comma-separated is fine. Used for lead overlap hints.</p>
              <div className="mt-6 space-y-2">
                <Label htmlFor="ob_skills">Skills</Label>
                <Input
                  id="ob_skills"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="React, UX writing, stakeholder workshops…"
                />
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Niches</p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">Where do you prefer to work?</h1>
              <div className="mt-6 space-y-2">
                <Label htmlFor="ob_niches">Industries / categories</Label>
                <Input
                  id="ob_niches"
                  value={nichesStr}
                  onChange={(e) => setNichesStr(e.target.value)}
                  placeholder="Fintech, health, developer tools…"
                />
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Experience</p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">Typical engagement level</h1>
              <div className="mt-6 space-y-2">
                <Label htmlFor="ob_exp">Level</Label>
                <select
                  id="ob_exp"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-secondary/90 px-3 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">Prefer not to say</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead / principal</option>
                </select>
              </div>
            </>
          ) : null}

          {step === 5 ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resume</p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">Optional resume</h1>
              <p className="mt-2 text-sm text-muted-foreground">PDFs are parsed on the server. You can paste or edit text after.</p>
              <div className="mt-6 min-h-0 flex-1 space-y-4">
                <ResumeUploadZone
                  resumeText={resumeText}
                  resumeFilename={resumeFilename}
                  onExtracted={(t, fn) => {
                    setResumeText(t);
                    setResumeFilename(fn);
                  }}
                />
                <div className="space-y-2">
                  <Label htmlFor="ob_resume">Resume text</Label>
                  <Textarea
                    id="ob_resume"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={5}
                    className="min-h-[120px] resize-y font-mono text-xs"
                    placeholder="Paste or refine extracted text…"
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === 6 ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Links</p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">Proof and presence</h1>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ob_site">Website (optional)</Label>
                  <Input id="ob_site" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob_port">Portfolio URLs</Label>
                  <Textarea
                    id="ob_port"
                    value={portfolioLines}
                    onChange={(e) => setPortfolioLines(e.target.value)}
                    rows={3}
                    className="resize-y font-mono text-xs"
                    placeholder={"https://…\nhttps://…"}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ob_li">LinkedIn</Label>
                    <Input id="ob_li" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="Profile URL" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ob_gh">GitHub</Label>
                    <Input id="ob_gh" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="Profile URL" />
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {step === 7 ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Goals</p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">What should Clinq optimize for?</h1>
              <p className="mt-2 text-sm text-muted-foreground">Short note—appended to your bio as “Focus areas” so proposals stay aligned.</p>
              <div className="mt-6 space-y-2">
                <Label htmlFor="ob_goals">Priorities</Label>
                <Textarea
                  id="ob_goals"
                  value={focusGoals}
                  onChange={(e) => setFocusGoals(e.target.value)}
                  rows={4}
                  className="min-h-[120px] resize-y"
                  placeholder="e.g. Fewer but larger contracts, US time zones, no rush jobs without discovery."
                />
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={step === 0 || pending}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="gap-1 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {step < TOTAL - 1 ? (
            <Button type="button" onClick={() => setStep((s) => Math.min(TOTAL - 1, s + 1))} disabled={pending} className="gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={finish} disabled={pending} className="gap-2">
              {pending ? "Saving…" : "Finish"}
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/profile" className="underline-offset-4 hover:underline">
            Open full profile
          </Link>
          {" · "}
          <span>Step {step + 1} of {TOTAL}</span>
        </p>
      </div>
    </div>
  );
}
