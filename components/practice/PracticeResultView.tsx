import Link from "next/link";
import type { PracticeResult } from "@/types/practice";
import { formatPercent } from "@/lib/format";

export function PracticeResultView({ result }: { result: PracticeResult }) {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-navy-900">Practice result</h1>
        <p className="mt-3 text-4xl font-semibold text-navy-900">
          {result.correct}/{result.total}
        </p>
        <p className="text-sm text-navy-500">
          Accuracy {formatPercent(result.accuracyPercent)}
          {result.durationSeconds != null ? ` · ${Math.round(result.durationSeconds / 60)} min` : null}
        </p>
      </header>

      <dl className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Correct", value: result.correct, tone: "text-seagreen-700" },
          { label: "Wrong", value: result.wrong, tone: "text-navy-900" },
          { label: "Skipped", value: result.skipped, tone: "text-navy-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-navy-50 px-3 py-3">
            <dt className="text-xs text-navy-500">{s.label}</dt>
            <dd className={`text-lg font-semibold ${s.tone}`}>{s.value}</dd>
          </div>
        ))}
      </dl>

      {result.weakTopics.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-navy-900">Needs attention</h2>
          <ul className="mt-2 space-y-1 text-sm text-navy-600">
            {result.weakTopics.map((t) => (
              <li key={t.name}>
                {t.name} · {Math.round(t.accuracy)}%
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.strongTopics.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-navy-900">Stronger areas</h2>
          <ul className="mt-2 space-y-1 text-sm text-navy-600">
            {result.strongTopics.map((t) => (
              <li key={t.name}>
                {t.name} · {Math.round(t.accuracy)}%
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link href="/practice/setup" className="rounded-xl bg-orange-500 px-4 py-2.5 text-center text-sm font-semibold text-white">
          Practice again
        </Link>
        <Link href={`/practice/result?session=${result.sessionId}&review=1`} className="rounded-xl border border-navy-200 px-4 py-2.5 text-center text-sm font-semibold text-navy-800">
          Review answers
        </Link>
        {result.reviewQuestionIds.length > 0 ? (
          <Link href="/review" className="rounded-xl border border-navy-200 px-4 py-2.5 text-center text-sm font-semibold text-navy-800">
            Questions to review
          </Link>
        ) : null}
        {result.weakTopics[0] ? (
          <Link href="/weak-areas" className="rounded-xl border border-navy-200 px-4 py-2.5 text-center text-sm font-semibold text-navy-800">
            Review weak topic
          </Link>
        ) : null}
        <Link href="/ask-tutor" className="rounded-xl border border-navy-200 px-4 py-2.5 text-center text-sm font-semibold text-navy-800">
          Ask Tutor
        </Link>
        <Link href="/learn" className="rounded-xl border border-navy-200 px-4 py-2.5 text-center text-sm font-semibold text-navy-800">
          Continue learning
        </Link>
      </nav>
    </div>
  );
}
