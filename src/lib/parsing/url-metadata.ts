import "server-only";

const MAX_BYTES = 512_000;

export type UrlMetadataResult = {
  url: string;
  finalUrl: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  fetchedAt: string;
};

function pickMeta(html: string, prop: string): string | null {
  const re = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
  const m = html.match(re);
  if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i");
  const m2 = html.match(re2);
  return m2?.[1] ? decodeHtmlEntities(m2[1].trim()) : null;
}

function pickNameMeta(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
  const m = html.match(re);
  if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i");
  const m2 = html.match(re2);
  return m2?.[1] ? decodeHtmlEntities(m2[1].trim()) : null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function pickTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]{1,500})<\/title>/i);
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : null;
}

/**
 * Fetch HTML and read OpenGraph / title tags only (no JS execution).
 * Blocks non-http(s) schemes.
 */
export async function fetchPublicUrlMetadata(url: string): Promise<UrlMetadataResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) URLs are supported");
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  let res: Response;
  try {
    res = await fetch(parsed.toString(), {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "ClinqBot/1.0 (+https://clinq) metadata-preview",
      },
    });
  } finally {
    clearTimeout(t);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const chunks: Uint8Array[] = [];
  let received = 0;
  while (received < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
    }
  }
  reader.releaseLock?.();

  const decoder = new TextDecoder("utf-8");
  const html = decoder.decode(Buffer.concat(chunks.map((c) => Buffer.from(c)))).slice(0, MAX_BYTES);

  const title =
    pickMeta(html, "og:title") || pickNameMeta(html, "twitter:title") || pickTitle(html) || pickNameMeta(html, "title");
  const description =
    pickMeta(html, "og:description") ||
    pickNameMeta(html, "twitter:description") ||
    pickNameMeta(html, "description");
  const siteName = pickMeta(html, "og:site_name");

  return {
    url: parsed.toString(),
    finalUrl: res.url,
    title,
    description,
    siteName,
    fetchedAt: new Date().toISOString(),
  };
}
