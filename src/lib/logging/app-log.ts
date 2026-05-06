import "server-only";

type LogScope = "freelancer_import" | "freelancer_token_validation" | "lead_promotion";

function emit(scope: LogScope, event: string, context: Record<string, unknown>, level: "info" | "warn" | "error") {
  const line = JSON.stringify({
    scope,
    event,
    level,
    ts: new Date().toISOString(),
    ...context,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function logFreelancerImport(event: string, context: Record<string, unknown> = {}, level: "info" | "warn" | "error" = "info") {
  emit("freelancer_import", event, context, level);
}

export function logFreelancerTokenValidation(event: string, context: Record<string, unknown> = {}, level: "info" | "warn" | "error" = "info") {
  emit("freelancer_token_validation", event, context, level);
}

export function logLeadPromotion(event: string, context: Record<string, unknown> = {}, level: "info" | "warn" | "error" = "info") {
  emit("lead_promotion", event, context, level);
}
