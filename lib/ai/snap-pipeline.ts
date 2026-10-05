import type { SnapExtractionResult, SnapSolveResult } from "@/types/ai";

const MIN_CONFIDENCE = 0.55;

/**
 * Snap mathematics pipeline (server-side stages).
 * Low confidence must not become a confident answer.
 */
export function evaluateExtractionConfidence(input: {
  text?: string;
  modelConfidence?: number;
  blurScore?: number;
}): SnapExtractionResult {
  const text = input.text?.trim() ?? "";
  if (!text || text.length < 3) {
    return {
      confidence: 0,
      readable: false,
      refusalReason: "We could not read a clear question. Please retake or upload a sharper image.",
    };
  }
  let confidence = input.modelConfidence ?? 0.5;
  if ((input.blurScore ?? 0) > 0.7) confidence *= 0.5;
  if (!/[0-9=+\-×x÷√∫∑]/.test(text) && !/[a-zA-Z]{3,}/.test(text)) {
    confidence *= 0.4;
  }
  if (confidence < MIN_CONFIDENCE) {
    return {
      confidence,
      readable: false,
      questionText: text,
      refusalReason:
        "The image is unclear or incomplete. Please retake with all numbers and symbols visible — we will not guess missing parts.",
    };
  }
  return { confidence, readable: true, questionText: text };
}

export function emptySnapRefusal(reason: string): SnapSolveResult {
  return {
    extraction: { confidence: 0, readable: false, refusalReason: reason },
  };
}

/** Host fills steps/answer only after high-confidence extraction + reasoning model */
export function attachSolution(
  extraction: SnapExtractionResult,
  solution: { steps: string[]; finalAnswer: string; latex?: string; relatedTopic?: string }
): SnapSolveResult {
  if (!extraction.readable) {
    return { extraction };
  }
  return {
    extraction,
    steps: solution.steps,
    finalAnswer: solution.finalAnswer,
    latex: solution.latex,
    relatedTopic: solution.relatedTopic,
    practiceHref: solution.relatedTopic
      ? `/practice/setup?topic=${encodeURIComponent(solution.relatedTopic)}`
      : "/practice/setup",
  };
}
