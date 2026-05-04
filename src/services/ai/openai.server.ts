import "server-only";

import OpenAI from "openai";

import { getOpenAIApiKey } from "@/utils/env-server";

let client: OpenAI | null = null;

/**
 * Lazily configured OpenAI client (server-only). Never import from Client Components.
 */
export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: getOpenAIApiKey() });
  }
  return client;
}
