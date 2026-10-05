export type AiRole =
  | "general_tutor"
  | "fast_response"
  | "reasoning"
  | "vision"
  | "summarization"
  | "retrieval"
  | "safety"
  | "stt"
  | "tts";

export interface AiMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface StudentAiContext {
  exam?: string | null;
  targetScore?: number | null;
  subjects?: string[];
  weakTopics?: { subject: string; topicName: string }[];
  currentSubject?: string | null;
  currentTopic?: string | null;
  currentQuestionId?: string | null;
  /** Only include fields that exist — never invent */
}

export interface AiChatRequest {
  conversationId?: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  context?: StudentAiContext;
  mode?: "tutor" | "class" | "voice" | "snap";
  stream?: boolean;
}

export interface AiChatChunk {
  type: "token" | "done" | "error" | "safety";
  text?: string;
  error?: string;
}

export type SnapPipelineStage =
  | "validate_image"
  | "vision_extract"
  | "confidence_check"
  | "reason"
  | "explain"
  | "recommend";

export interface SnapExtractionResult {
  confidence: number; // 0–1
  readable: boolean;
  questionText?: string;
  notes?: string;
  refusalReason?: string;
}

export interface SnapSolveResult {
  extraction: SnapExtractionResult;
  steps?: string[];
  finalAnswer?: string;
  latex?: string;
  relatedTopic?: string;
  practiceHref?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  mode: "tutor" | "class" | "voice" | "snap";
  updatedAt: string;
  subject?: string;
}
