/**
 * Provider abstraction — all LLM/STT/TTS calls are server-side only.
 * API keys must never appear in client bundles or ZIP artifacts.
 */

import type { AiChatRequest, AiChatChunk, AiRole } from "@/types/ai";

export interface AiProvider {
  readonly name: string;
  chat(req: AiChatRequest, role?: AiRole): AsyncIterable<AiChatChunk>;
  complete?(req: AiChatRequest, role?: AiRole): Promise<string>;
}

export interface VisionProvider {
  extractMathQuestion(imageBytes: Uint8Array, mimeType: string): Promise<{
    confidence: number;
    text?: string;
    error?: string;
  }>;
}

export interface SpeechProvider {
  transcribe(audio: Uint8Array, mimeType: string): Promise<{ text: string } | { error: string }>;
  synthesize?(text: string): Promise<{ audioUrl?: string; error?: string }>;
}

/** Route roles to models without hard-coding vendor secrets */
export interface ModelRouterConfig {
  generalTutor: string;
  fastResponse: string;
  reasoning: string;
  vision: string;
  summarization: string;
  safety: string;
}

export const DEFAULT_ROLE_HINTS: Record<AiRole, string> = {
  general_tutor: "Patient Nigerian secondary/tertiary exam tutor. Clear steps. No invented exam facts.",
  fast_response: "Short, direct educational answer.",
  reasoning: "Step-by-step mathematical or multi-step reasoning.",
  vision: "Extract text/math from images; report low confidence when unclear.",
  summarization: "Concise summary of learning material.",
  retrieval: "Select relevant lesson/topic IDs from provided catalogue only.",
  safety: "Refuse secrets, private data exposure, and fabricated official claims.",
  stt: "Speech to text",
  tts: "Text to speech",
};

export function buildSystemPrompt(mode: "tutor" | "class" | "voice" | "snap", ctx?: AiChatRequest["context"]): string {
  const lines = [
    "You are TUTOR-ME AI, an educational assistant for Nigerian exam preparation (JAMB, WAEC, NECO, BECE).",
    "You are AI, not a human teacher. Be honest about uncertainty.",
    "Do not invent official past questions, licences, scores, or private student data.",
    "Prefer simple language and worked examples.",
  ];
  if (mode === "class") {
    lines.push("You are running a live teaching session: teach, ask questions, wait for answers, adapt.");
  }
  if (mode === "snap") {
    lines.push("Solve only what is clearly readable from the image extraction. Never invent missing numbers or symbols.");
  }
  if (ctx?.exam) lines.push(`Student exam focus: ${ctx.exam}.`);
  if (ctx?.currentSubject) lines.push(`Current subject: ${ctx.currentSubject}.`);
  if (ctx?.currentTopic) lines.push(`Current topic: ${ctx.currentTopic}.`);
  if (ctx?.weakTopics?.length) {
    lines.push(
      `Known weak topics from data: ${ctx.weakTopics.map((w) => `${w.subject} ${w.topicName}`).join("; ")}.`
    );
  }
  return lines.join("\n");
}
