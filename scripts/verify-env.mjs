/**
 * Validates local env files (.env.local then .env) for Clinq infrastructure.
 * Does not print secret values.
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envLocal = resolve(root, ".env.local");
const envFile = resolve(root, ".env");

if (existsSync(envLocal)) {
  config({ path: envLocal });
}
if (existsSync(envFile)) {
  config({ path: envFile });
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "OPENAI_API_KEY",
];

const optionalNote = "SUPABASE_SERVICE_ROLE_KEY (optional unless using admin client)";

const missing = required.filter((key) => !process.env[key]?.trim());

if (!existsSync(envLocal) && !existsSync(envFile)) {
  console.error("No .env.local or .env found at project root.");
  console.error("Copy .env.example to .env.local and fill in values.");
  process.exit(1);
}

if (missing.length) {
  console.error("Missing or empty required variables:", missing.join(", "));
  console.error(`Optional: ${optionalNote}`);
  process.exit(1);
}

try {
  new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
} catch {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  process.exit(1);
}

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length < 20) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY looks too short.");
  process.exit(1);
}

console.log("Environment check passed for:", required.join(", "));
if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
  console.log("(Optional) SUPABASE_SERVICE_ROLE_KEY not set — admin client unavailable until configured.");
}
