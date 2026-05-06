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

  return {
    skills: dedupe(skills),
    experience: dedupe(experience),
    projects: dedupe(projects),
    tech_stack,
  };
}
