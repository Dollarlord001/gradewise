import type { PracticeAnswerState, PracticeQuestion, PracticeResult, PracticeResultBreakdown } from "@/types/practice";

/** Server-side scoring only — never trust client-reported isCorrect for official results. */
export function scorePracticeSession(input: {
  sessionId: string;
  questions: PracticeQuestion[];
  answers: Record<string, PracticeAnswerState>;
  durationSeconds?: number | null;
}): PracticeResult {
  const breakdown: PracticeResultBreakdown[] = [];
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  for (const q of input.questions) {
    const a = input.answers[q.id];
    const selected = a?.selectedKey ?? null;
    const correctKey = q.correctKey ?? null;
    const isSkipped = selected == null || selected === "";
    const isCorrect = !isSkipped && correctKey != null && selected === correctKey;
    if (isSkipped) skipped++;
    else if (isCorrect) correct++;
    else wrong++;
    breakdown.push({
      questionId: q.id,
      selectedKey: selected,
      correctKey,
      isCorrect,
      skipped: isSkipped,
      topicName: q.topicName,
      subject: q.subject,
    });
  }

  const total = input.questions.length;
  const attempted = correct + wrong;
  const accuracyPercent = attempted === 0 ? null : (correct / attempted) * 100;

  const byTopic = new Map<string, { c: number; t: number }>();
  for (const b of breakdown) {
    if (!b.topicName || b.skipped) continue;
    const cur = byTopic.get(b.topicName) ?? { c: 0, t: 0 };
    cur.t++;
    if (b.isCorrect) cur.c++;
    byTopic.set(b.topicName, cur);
  }
  const topicStats = [...byTopic.entries()].map(([name, v]) => ({
    name,
    accuracy: v.t ? (v.c / v.t) * 100 : 0,
  }));
  const strongTopics = topicStats.filter((t) => t.accuracy >= 70).sort((a, b) => b.accuracy - a.accuracy);
  const weakTopics = topicStats.filter((t) => t.accuracy < 60).sort((a, b) => a.accuracy - b.accuracy);

  return {
    sessionId: input.sessionId,
    score: correct,
    total,
    correct,
    wrong,
    skipped,
    accuracyPercent,
    durationSeconds: input.durationSeconds ?? null,
    breakdown,
    strongTopics,
    weakTopics,
    reviewQuestionIds: breakdown.filter((b) => !b.skipped && !b.isCorrect).map((b) => b.questionId),
  };
}

export function validateCbtFormShape(input: {
  mode: string;
  questionCount: number;
  subjectCount: number;
  durationSeconds: number;
}): string | null {
  if (input.mode === "full") {
    if (input.durationSeconds !== 7200) return "full CBT requires 7200 seconds";
    if (input.questionCount !== 180) return "full CBT requires 180 questions";
    if (input.subjectCount !== 4) return "full CBT requires 4 subjects";
  }
  if (input.mode === "practice") {
    if (input.questionCount < 1 || input.questionCount > 40) return "practice CBT allows 1–40 questions";
    if (input.subjectCount !== 1) return "practice CBT requires exactly 1 subject";
    if (input.durationSeconds < 60 || input.durationSeconds > 86400) return "invalid practice duration";
  }
  return null;
}
