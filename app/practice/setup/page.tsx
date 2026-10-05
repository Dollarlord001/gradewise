"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EXAMS = ["JAMB", "WAEC", "NECO", "BECE"] as const;

export default function PracticeSetupPage() {
  const router = useRouter();
  const [exam, setExam] = useState<string>("JAMB");
  const [subject, setSubject] = useState("Mathematics");
  const [count, setCount] = useState(20);
  const [timed, setTimed] = useState(false);

  function start() {
    const q = new URLSearchParams({
      exam,
      subject,
      count: String(count),
      timed: timed ? "1" : "0",
    });
    router.push(`/practice/session?${q.toString()}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Practice setup</h1>
      <p className="mt-1 text-sm text-navy-500">Choose what you want to work on. You can change topics anytime.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <label className="block text-sm">
          <span className="font-medium text-navy-700">Exam</span>
          <select className="mt-1 w-full rounded-xl border border-navy-200 px-3 py-2.5" value={exam} onChange={(e) => setExam(e.target.value)}>
            {EXAMS.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy-700">Subject</span>
          <input className="mt-1 w-full rounded-xl border border-navy-200 px-3 py-2.5" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy-700">Number of questions</span>
          <input type="number" min={5} max={40} className="mt-1 w-full rounded-xl border border-navy-200 px-3 py-2.5" value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
          Timed session
        </label>
        <button type="submit" className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white">
          Begin
        </button>
      </form>
    </div>
  );
}
