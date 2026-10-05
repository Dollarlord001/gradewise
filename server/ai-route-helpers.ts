import "server-only";

/**
 * Intended for Route Handlers / Server Actions only.
 * Example: app/api/ai/chat/route.ts streams using a server provider.
 *
 * process.env.AI_API_KEY — server only, never NEXT_PUBLIC_
 */

export function requireServerAiKey(): string {
  const key = process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY ?? process.env.GROQ_API_KEY ?? process.env.NVIDIA_API_KEY;
  if (!key) {
    throw new Error("AI provider key not configured on server");
  }
  return key;
}

export function getAiProviderConfig() {
  const key = requireServerAiKey();
  const explicitBase = process.env.AI_BASE_URL?.replace(/\/$/, "");
  const baseUrl = explicitBase ?? (process.env.GROQ_API_KEY && key === process.env.GROQ_API_KEY
    ? "https://api.groq.com/openai/v1"
    : process.env.NVIDIA_API_KEY && key === process.env.NVIDIA_API_KEY
      ? "https://integrate.api.nvidia.com/v1"
      : "https://api.openai.com/v1");
  const model = process.env.AI_MODEL_TUTOR ?? process.env.GROQ_MODEL ?? process.env.NVIDIA_MODEL ?? "gpt-4o-mini";
  return { key, baseUrl, model };
}

export const AI_ENV_DOCS = `
Server-only (never commit real values):
  AI_API_KEY=
  NVIDIA_API_KEY=   # optional if using NVIDIA-compatible endpoint
  AI_BASE_URL=      # optional custom endpoint
  AI_MODEL_TUTOR=
  AI_MODEL_REASONING=
  AI_MODEL_VISION=
  STT_API_KEY=      # optional speech-to-text
  TTS_API_KEY=      # optional text-to-speech

Public (ok in client):
  NEXT_PUBLIC_SITE_URL=
`;
