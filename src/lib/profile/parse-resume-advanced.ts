/**
 * Deterministic resume text parsing — no model calls.
 * Best-effort sections; returns empty arrays when nothing matches.
 */
export type ParsedResumeAdvanced = {
  skills: string[];
  experience: string[];
  projects: string[];
};

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

  return {
    skills: dedupe(skills),
    experience: dedupe(experience),
    projects: dedupe(projects),
  };
}
