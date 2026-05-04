"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import { updateFreelancerProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FreelancerProfileFields } from "@/types/profile";

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

export function FreelancerProfileForm({ initial }: { initial: FreelancerProfileFields }) {
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(initial.display_name ?? "");
  const [resumeText, setResumeText] = useState(initial.resume_text ?? "");
  const [resumeFilename, setResumeFilename] = useState(initial.resume_filename ?? "");
  const [skills, setSkills] = useState((initial.skills ?? []).join(", "));
  const [techStack, setTechStack] = useState((initial.tech_stack ?? []).join(", "));
  const [niches, setNiches] = useState((initial.niches ?? []).join(", "));
  const [portfolioLines, setPortfolioLines] = useState((initial.portfolio_links ?? []).join("\n"));
  const [linkedin, setLinkedin] = useState(initial.linkedin_url ?? "");
  const [github, setGithub] = useState(initial.github_url ?? "");
  const [experience, setExperience] = useState(initial.experience_level ?? "");
  const [markComplete, setMarkComplete] = useState(Boolean(initial.profile_onboarding_completed_at));

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!/\.(txt|md)$/i.test(f.name)) {
      toast.error("For now upload plain text (.txt or .md). Paste PDF content below, or export to text.");
      return;
    }
    try {
      const text = await f.text();
      setResumeText(text.slice(0, 48_000));
      setResumeFilename(f.name);
      toast.success("Resume text loaded from file");
    } catch {
      toast.error("Could not read file");
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      void (async () => {
        const res = await updateFreelancerProfileAction({
          display_name: displayName.trim() || null,
          resume_text: resumeText.trim() || null,
          resume_filename: resumeFilename.trim() || null,
          skills: splitTags(skills),
          tech_stack: splitTags(techStack),
          niches: splitTags(niches),
          portfolio_links: splitLines(portfolioLines),
          linkedin_url: linkedin.trim() || undefined,
          github_url: github.trim() || undefined,
          experience_level: experience ? (experience as "junior" | "mid" | "senior" | "lead") : null,
          markComplete,
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Profile saved");
      })();
    });
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-10 pb-16">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Identity</h2>
        <div className="space-y-2">
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            value={displayName}
            onChange={(ev) => setDisplayName(ev.target.value)}
            placeholder="How you sign proposals"
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="experience">Experience level</Label>
          <select
            id="experience"
            value={experience}
            onChange={(ev) => setExperience(ev.target.value)}
            className="flex h-10 w-full max-w-xs rounded-md border border-input bg-secondary/90 px-3 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Not specified</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead / principal</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Resume</h2>
        <p className="text-xs text-muted-foreground">Stored as text in your workspace (Supabase). No third-party parsing.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept=".txt,.md,text/plain" className="hidden" onChange={onPickFile} />
          <Button type="button" variant="outline" size="sm" className="gap-2 border-clinq-glass-border" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Upload .txt / .md
          </Button>
          {resumeFilename ? <span className="text-xs text-muted-foreground">{resumeFilename}</span> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="resume">Resume / CV text</Label>
          <Textarea
            id="resume"
            value={resumeText}
            onChange={(ev) => setResumeText(ev.target.value)}
            placeholder="Paste resume or key achievements. Used in proposal generation (truncated for token limits)."
            rows={8}
            className="min-h-[180px] resize-y"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Positioning</h2>
        <div className="space-y-2">
          <Label htmlFor="skills">Skills</Label>
          <Input id="skills" value={skills} onChange={(ev) => setSkills(ev.target.value)} placeholder="e.g. React, PM, UX — comma separated" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tech">Tech stack</Label>
          <Input id="tech" value={techStack} onChange={(ev) => setTechStack(ev.target.value)} placeholder="e.g. TypeScript, Postgres, AWS" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="niches">Niches / categories</Label>
          <Input id="niches" value={niches} onChange={(ev) => setNiches(ev.target.value)} placeholder="e.g. SaaS, fintech, health" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Links</h2>
        <div className="space-y-2">
          <Label htmlFor="portfolio">Portfolio URLs</Label>
          <Textarea
            id="portfolio"
            value={portfolioLines}
            onChange={(ev) => setPortfolioLines(ev.target.value)}
            placeholder={"https://…\nhttps://…"}
            rows={4}
            className="resize-y font-mono text-xs"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" value={linkedin} onChange={(ev) => setLinkedin(ev.target.value)} placeholder="https://linkedin.com/in/…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input id="github" value={github} onChange={(ev) => setGithub(ev.target.value)} placeholder="https://github.com/…" />
          </div>
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-xl border border-clinq-glass-border/80 bg-background/40 p-4">
        <input
          id="mark_complete"
          type="checkbox"
          checked={markComplete}
          onChange={(ev) => setMarkComplete(ev.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
        />
        <label htmlFor="mark_complete" className="text-sm leading-snug text-muted-foreground">
          Mark profile onboarding as complete (timestamp stored). You can still edit anytime.
        </label>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="min-w-[8rem]">
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save profile"
          )}
        </Button>
      </div>
    </form>
  );
}
