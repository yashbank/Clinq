import "server-only";

export type LinkedInParseResult = {
  status: "not_implemented";
  reason: string;
};

/**
 * LinkedIn does not offer a safe public HTML/API flow for third parties without OAuth.
 * Do not scrape authenticated LinkedIn pages.
 */
export function linkedInPublicPlaceholder(): LinkedInParseResult {
  return {
    status: "not_implemented",
    reason:
      "LinkedIn ingestion requires official partner APIs or user OAuth. Clinq does not scrape LinkedIn HTML.",
  };
}
