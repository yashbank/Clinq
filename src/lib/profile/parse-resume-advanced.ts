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
  /** Best-effort headline / role from the first substantive line. */
  role_line: string | null;
  /** Short positioning paragraph for empty bios (deterministic, not fabricated employers). */
  summary_draft: string | null;
  /** e.g. "8+ years" when phrasing appears in text. */
  years_experience_hint: string | null;
  inferred_niches: string[];
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  /** Additional https URLs suitable for portfolio list (excludes linkedin/github duplicates). */
  portfolio_urls: string[];
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

const URL_RE = /\bhttps?:\/\/[^\s)<>"']{6,2000}/gi;

function extractUrls(text: string): {
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  portfolio_urls: string[];
} {
  const raw = text.slice(0, 80_000).match(URL_RE) ?? [];
  const uniq = [...new Set(raw.map((u) => u.replace(/[),.;]+$/g, "").trim()))].filter(Boolean);
  let linkedin_url: string | null = null;
  let github_url: string | null = null;
  const portfolio_urls: string[] = [];
  for (const u of uniq) {
    try {
      const h = new URL(u).href;
      if (/linkedin\.com\//i.test(h)) {
        if (!linkedin_url) linkedin_url = h.slice(0, 2000);
        continue;
      }
      if (/github\.com\//i.test(h)) {
        if (!github_url) github_url = h.slice(0, 2000);
        continue;
      }
      if (portfolio_urls.length < 8) portfolio_urls.push(h.slice(0, 2000));
    } catch {
      /* skip */
    }
  }
  const website_url = portfolio_urls.find((u) => !/linkedin\.com|github\.com|twitter\.com|x\.com/i.test(u)) ?? null;
  return { linkedin_url, github_url, website_url, portfolio_urls };
}

function inferRoleLine(all: string[]): string | null {
  for (const l of all.slice(0, 12)) {
    if (l.length < 4 || l.length > 90) continue;
    if (/^(skills|experience|education|projects|employment)/i.test(l)) continue;
    if (/^[-•*#]/.test(l)) continue;
    if (/^\d{4}\s*[-–]/.test(l)) continue;
    if (/[|]{2,}/.test(l)) continue;
    return l;
  }
  return null;
}

function inferSummaryDraft(text: string, role: string | null): string | null {
  const body = text.replace(/\r/g, "").trim();
  if (body.length < 80) return null;
  const skip = new Set(
    ["summary", "profile", "objective", "about"].map((s) => s.toLowerCase()),
  );
  const lines = body.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const acc: string[] = [];
  for (const l of lines) {
    if (acc.length === 0 && role && l === role) continue;
    if (/^(work experience|experience|education|skills)/i.test(l)) break;
    if (skip.has(l.toLowerCase()) && acc.length === 0) continue;
    if (l.length < 20 && acc.length === 0) continue;
    acc.push(l);
    if (acc.join(" ").length > 360) break;
  }
  const out = acc.join(" ").replace(/\s+/g, " ").trim();
  if (out.length < 60) return null;
  return out.slice(0, 2000);
}

function inferYearsHint(text: string): string | null {
  const m =
    text.match(/\b(\d{1,2})\s*\+\s*years?\b/i) ||
    text.match(/\b(\d{1,2})\s*[-–]\s*(\d{1,2})\s*years?\b/i) ||
    text.match(/\bover\s+(\d{1,2})\s+years?\b/i);
  if (m) return m[0]!.trim().slice(0, 40);
  return null;
}

function inferNichesFromText(text: string, tech: string[]): string[] {
  const t = `${text} ${tech.join(" ")}`.toLowerCase();
  const out: string[] = [];
  if (/\b(saas|b2b|subscription)\b/.test(t)) out.push("SaaS");
  if (/\b(fintech|banking|payment|stripe|ledger)\b/.test(t)) out.push("Fintech");
  if (/\b(health|medical|hipaa|clinical)\b/.test(t)) out.push("Healthtech");
  if (/\b(e-?commerce|shopify|retail)\b/.test(t)) out.push("E-commerce");
  if (/\b(ai|machine learning|mlops|llm)\b/.test(t)) out.push("AI / ML");
  return [...new Set(out)].slice(0, 12);
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
  const urls = extractUrls(text);
  const role_line = inferRoleLine(all);
  const summary_draft = inferSummaryDraft(text, role_line);
  const years_experience_hint = inferYearsHint(text);
  const inferred_niches = inferNichesFromText(text, tech_stack);

  return {
    skills: dedupe(skills),
    experience: dedupe(experience),
    projects: dedupe(projects),
    tech_stack,
    role_line,
    summary_draft,
    years_experience_hint,
    inferred_niches,
    linkedin_url: urls.linkedin_url,
    github_url: urls.github_url,
    website_url: urls.website_url,
    portfolio_urls: urls.portfolio_urls,
  };
}
