import "server-only";

/**
 * Extract plain text from a PDF buffer using pdf-parse (server-only).
 * Safe for user-uploaded resumes; does not execute scripts inside PDFs beyond the parser.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<{ text: string; pages?: number }> {
  const mod = await import("pdf-parse");
  const pdfParse = mod.default as (b: Buffer) => Promise<{ text: string; numpages?: number }>;
  const res = await pdfParse(buffer);
  const text = (res.text ?? "").replace(/\u0000/g, "").trim();
  return { text, pages: res.numpages };
}
