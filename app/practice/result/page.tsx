import { PracticeResultView } from "@/components/practice/PracticeResultView";
import type { PracticeResult } from "@/types/practice";

export default function PracticeResultPage() {
  // Host loads scored result from server by session id
  const empty: PracticeResult = {
    sessionId: "",
    score: 0,
    total: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    accuracyPercent: null,
    durationSeconds: null,
    breakdown: [],
    strongTopics: [],
    weakTopics: [],
    reviewQuestionIds: [],
  };
  return (
    <div className="px-4 py-8">
      <PracticeResultView result={empty} />
    </div>
  );
}
