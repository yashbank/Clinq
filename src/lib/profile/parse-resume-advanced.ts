/**
 * Deterministic resume text parsing — no model calls.
 * Best-effort sections; returns empty arrays when nothing matches.
 */
export type ParsedResumeAdvanced = {
  skills: string[];
  experience: string[];
  projects: string[];
  /** Normalized technology tokens detected in the document (best-effort). */
  tech_stack: string[];
  linkedin_url: string | null;
  github_url: string | null;
  /** Additional http(s) URLs (excluding linkedin/github duplicates). */
  other_urls: string[];
  /** Draft summary from resume text (deterministic excerpt). */
  summary_suggestion: string | null;
  /** First plausible headline / title line. */
  headline_suggestion: string | null;
  /** Total years of experience inferred from text (heuristic). */
  years_experience_hint: number | null;
  /** Broad niches inferred from detected tech keywords. */
  niche_suggestions: string[];
};

const TECH_PATTERN =
  /\b(JavaScript|TypeScript|React\.?js?|Next\.?js|Node\.?js|Python|Django|Flask|PostgreSQL|Postgres|MySQL|MongoDB|Redis|AWS|GCP|Azure|Docker|Kubernetes|K8s|Terraform|GraphQL|REST|gRPC|Go\b|Rust|Java\b|Spring|Kotlin|Swift|iOS|Android|React Native|Flutter|Ruby on Rails|Rails|PHP|Laravel|C\+\+|\.NET|C#|Tailwind|Figma|Webpack|Vite)\b/gi;

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function takeBulletBlock(startIdx: number, all: string[], max: number): string[] {
  const out: string[] = [];
  for (let i = startIdx; i < all.length && out.length < max; i++) {
    const l = all[i];
    if (/^(skills|experience|employment|work history|projects|selected projects)\b/i.test(l)) break;
    if (/^[-•*]/.test(l) || /^\d+[.)]/.test(l)) {
      out.push(l.replace(/^[-•*\d.)]+\s*/, "").trim());
    } else if (out.length > 0 && l.length < 120) {
      out.push(l);
    } else if (out.length === 0) break;
    else break;
  }
  return out.filter(Boolean);
}

function techStackFromText(text: string): string[] {
  const found = new Set<string>();
  const slice = text.slice(0, 80_000);
  let m: RegExpExecArray | null;
  const re = new RegExp(TECH_PATTERN.source, TECH_PATTERN.flags);
  while ((m = re.exec(slice)) !== null) {
    const v = m[0].replace(/\s+/g, " ").trim();
    if (v.length > 1) found.add(v.replace(/\.js$/i, ".js"));
  }
  return [...found].slice(0, 40);
}

const LINKEDIN_RE = /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|pub|company)\/[^\s)\]>"']+/gi;
const GITHUB_RE = /https?:\/\/(?:www\.)?github\.com\/[^\s)\]>"']+/gi;
const URL_RE = /https?:\/\/[^\s)\]>"']+/gi;

export function extractUrlsFromResumeText(text: string): {
  linkedin_url: string | null;
  github_url: string | null;
  other_urls: string[];
} {
  const slice = text.slice(0, 48_000);
  const li = slice.match(LINKEDIN_RE);
  const gh = slice.match(GITHUB_RE);
  const linkedin_url = li?.[0] ? li[0].trim().slice(0, 2000) : null;
  const github_url = gh?.[0] ? gh[0].trim().slice(0, 2000) : null;
  const seen = new Set<string>();
  const other_urls: string[] = [];
  const mAll = slice.match(URL_RE) ?? [];
  for (const raw of mAll) {
    const u = raw.trim().replace(/[,;.]+$/, "").slice(0, 2000);
    if (!u || u.startsWith("mailto:")) continue;
    const low = u.toLowerCase();
    if (linkedin_url && low === linkedin_url.toLowerCase()) continue;
    if (github_url && low === github_url.toLowerCase()) continue;
    if (seen.has(low)) continue;
    seen.add(low);
    other_urls.push(u);
    if (other_urls.length >= 12) break;
  }
  return { linkedin_url, github_url, other_urls };
}

export function inferResumeSummaryDraft(text: string): string | null {
  const all = lines(text.slice(0, 48_000));
  for (let i = 0; i < all.length; i++) {
    if (/^(summary|professional summary|profile|about(\s+me)?|objective)\b/i.test(all[i])) {
      const chunk = all.slice(i + 1, i + 12).join("\n").trim();
      if (chunk.length > 40) return chunk.slice(0, 900);
    }
  }
  const skip = /^(education|experience|skills|employment|work history|projects)\b/i;
  const body: string[] = [];
  for (const l of all) {
    if (skip.test(l)) break;
    if (/^\+?\d[\d\s().-]{7,}\d$/.test(l)) continue;
    if (/^[\w.+-]+@[\w.-]+\.\w{2,}$/i.test(l)) continue;
    if (/^https?:\/\//i.test(l)) continue;
    if (l.length > 12) body.push(l);
    if (body.join(" ").length > 420) break;
  }
  const out = body.join("\n").trim();
  return out.length > 48 ? out.slice(0, 900) : null;
}

export function inferHeadlineFromResume(text: string): string | null {
  for (const l of lines(text.slice(0, 4000))) {
    if (l.length < 6 || l.length > 88) continue;
    if (/^https?:\/\//i.test(l)) continue;
    if (/^[\w.+-]+@[\w.-]+\.\w{2,}$/i.test(l)) continue;
    if (/^(skills|experience|education|summary)\b/i.test(l)) continue;
    if (/^\d{4}\s*[-–]/.test(l)) continue;
    return l.trim();
  }
  return null;
}

export function inferYearsExperienceHint(text: string): number | null {
  const t = text.slice(0, 48_000).toLowerCase();
  const m1 = t.match(/\b(\d{1,2})\+?\s*years?\s+of\s+experience\b/);
  if (m1) {
    const n = parseInt(m1[1]!, 10);
    if (n > 0 && n < 50) return n;
  }
  const years: number[] = [];
  const re = /\b(19[89]\d|20[0-2]\d)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    years.push(parseInt(m[0]!, 10));
  }
  if (years.length >= 2) {
    years.sort((a, b) => a - b);
    const span = years[years.length - 1]! - years[0]!;
    if (span > 0 && span < 45) return span;
  }
  return null;
}

const TECH_TO_NICHE: { re: RegExp; label: string }[] = [
  { re: /\b(react|vue|angular|next\.?js|typescript|javascript|frontend|front-end)\b/i, label: "Front-end engineering" },
  { re: /\b(node\.?js|python|java|go\b|rust|c\+\+|backend|api|graphql|microservices)\b/i, label: "Backend & APIs" },
  { re: /\b(aws|gcp|azure|kubernetes|docker|terraform|devops|ci\/cd)\b/i, label: "Cloud & DevOps" },
  { re: /\b(mobile|ios|android|react native|flutter|swift|kotlin)\b/i, label: "Mobile development" },
  { re: /\b(postgres|mysql|mongo|redis|sql|data warehouse|etl|analytics)\b/i, label: "Data & persistence" },
  { re: /\b(ml|machine learning|pytorch|tensorflow|nlp|llm)\b/i, label: "ML / AI engineering" },
  { re: /\b(figma|ux|ui|design system)\b/i, label: "Product design" },
];

export function inferNicheTagsFromTech(techStack: string[]): string[] {
  const hay = techStack.join(" ").toLowerCase();
  const out: string[] = [];
  const seen = new Set<string>();
  for (const { re, label } of TECH_TO_NICHE) {
    if (re.test(hay) && !seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  }
  return out.slice(0, 8);
}

export function parseResumeAdvanced(text: string): ParsedResumeAdvanced {
  const all = lines(text.slice(0, 80_000));
  const skills: string[] = [];
  const experience: string[] = [];
  const projects: string[] = [];

  for (let i = 0; i < all.length; i++) {
    const l = all[i];
    if (/^skills?\b/i.test(l)) {
      skills.push(...takeBulletBlock(i + 1, all, 40));
    }
    if (/^(experience|employment|work history)\b/i.test(l)) {
      experience.push(...takeBulletBlock(i + 1, all, 25));
    }
    if (/^projects?\b/i.test(l)) {
      projects.push(...takeBulletBlock(i + 1, all, 20));
    }
  }

  const dedupe = (arr: string[]) => [...new Set(arr.map((s) => s.trim()).filter((s) => s.length > 1))].slice(0, 60);

  if (skills.length === 0) {
    const comma = text.match(/skills?[:\s]+([^\n]{3,400})/i);
    if (comma?.[1]) {
      comma[1]
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 48)
        .slice(0, 30)
        .forEach((s) => skills.push(s));
    }
  }

  const tech_stack = dedupe(techStackFromText(text));
  const urls = extractUrlsFromResumeText(text);
  const summary_suggestion = inferResumeSummaryDraft(text);
  const headline_suggestion = inferHeadlineFromResume(text);
  const years_experience_hint = inferYearsExperienceHint(text);
  const niche_suggestions = inferNicheTagsFromTech(tech_stack);

  return {
    skills: dedupe(skills),
    experience: dedupe(experience),
    projects: dedupe(projects),
    tech_stack,
    linkedin_url: urls.linkedin_url,
    github_url: urls.github_url,
    other_urls: urls.other_urls,
    summary_suggestion,
    headline_suggestion,
    years_experience_hint,
    niche_suggestions,
  };
}
