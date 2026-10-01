"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/ui";

const questions = [
  { subject: "Chemistry", topic: "Organic Chemistry", text: "Which of the following is the general formula for an open-chain alkane?", options: ["CₙH₂ₙ", "CₙH₂ₙ₊₂", "CₙH₂ₙ₋₂", "CₙHₙ"], answer: 1, explain: "Alkanes contain only single carbon–carbon bonds. The open-chain formula is CₙH₂ₙ₊₂." },
  { subject: "Biology", topic: "Cell Biology", text: "Which cell structure is primarily responsible for releasing energy during aerobic respiration?", options: ["Ribosome", "Mitochondrion", "Golgi apparatus", "Cell wall"], answer: 1, explain: "Mitochondria are the main sites of aerobic respiration and ATP production in eukaryotic cells." },
  { subject: "Mathematics", topic: "Algebra", text: "If 3x − 5 = 16, what is the value of x?", options: ["5", "6", "7", "8"], answer: 2, explain: "Add 5 to both sides to get 3x = 21, then divide both sides by 3. So x = 7." },
  { subject: "Use of English", topic: "Grammar", text: "Choose the word nearest in meaning to ‘diligent’. ", options: ["Careless", "Hard-working", "Impatient", "Uncertain"], answer: 1, explain: "A diligent person is careful and steady in their work; ‘hard-working’ is the closest option." },
];

function formatTime(totalSeconds: number) {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

export function CbtDemo() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [review, setReview] = useState<boolean[]>(questions.map(() => false));
  const [seconds, setSeconds] = useState(20 * 60);
  const [confirm, setConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const item = questions[current];
  const answered = answers.filter((answer) => answer !== null).length;

  useEffect(() => {
    if (submitted || seconds === 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds, submitted]);

  function finish() {
    setSubmitted(true);
    setConfirm(false);
  }

  if (submitted) {
    const correct = answers.reduce<number>((total, answer, index) => total + (answer === questions[index].answer ? 1 : 0), 0);
    return <section className="cbt-demo-shell cbt-results"><div className="cbt-demo-title"><span className="eyebrow">Demo session complete</span><h2>Your practice results</h2><p>This sample result is shown on this device only. It isn’t saved to an account.</p></div><div className="cbt-result-score"><span className="result-ring"><strong>{Math.round((correct / questions.length) * 100)}<small>%</small></strong></span><div><span className="eyebrow">SAMPLE ACCURACY</span><h3>{correct} of {questions.length} correct</h3><p>Use the review below to understand each answer.</p></div></div><div className="cbt-result-metrics"><div><strong>{answered}</strong><span>answered</span></div><div><strong>{questions.length - answered}</strong><span>unanswered</span></div><div><strong>{review.filter(Boolean).length}</strong><span>marked to review</span></div><div><strong>{formatTime(20 * 60 - seconds)}</strong><span>time used</span></div></div><div className="cbt-review-list"><h3>Review answers</h3>{questions.map((question, index) => <article key={question.topic} className="cbt-review-item"><span className={answers[index] === question.answer ? "review-correct" : "review-incorrect"}>{answers[index] === question.answer ? "✓" : "!"}</span><div><strong>{index + 1}. {question.topic}</strong><p>Your answer: {answers[index] === null ? "Not answered" : question.options[answers[index]!]}</p><small>Correct answer: {question.options[question.answer]}. {question.explain}</small></div></article>)}</div><button className="button cbt-restart" onClick={() => { setCurrent(0); setAnswers(questions.map(() => null)); setReview(questions.map(() => false)); setSeconds(20 * 60); setSubmitted(false); }} type="button">Try the demo again <span>↻</span></button></section>;
  }

  return <section className="cbt-demo-shell"><div className="cbt-demo-banner"><div><span className="eyebrow">TUTOR-ME CBT EXPERIENCE</span><strong>JAMB practice · Mixed subjects</strong></div><span className="cbt-demo-badge">DEMO · NOT SAVED</span></div><div className="cbt-session-stats"><span><small>TIME REMAINING</small><strong className={seconds < 120 ? "timer-warning" : ""}>◷ &nbsp;{formatTime(seconds)}</strong></span><span><small>QUESTIONS</small><strong>{current + 1} <i>of {questions.length}</i></strong></span><span><small>ANSWERED</small><strong>{answered} <i>of {questions.length}</i></strong></span></div><ProgressBar value={Math.round((answered / questions.length) * 100)} label="Session progress"/><div className="cbt-session-body"><aside className="cbt-question-nav"><h3>Question map</h3><div className="cbt-question-grid">{questions.map((question, index) => <button key={question.topic} type="button" className={`cbt-number${current === index ? " cbt-current" : ""}${answers[index] !== null ? " cbt-answered" : ""}${review[index] ? " cbt-marked" : ""}`} onClick={() => setCurrent(index)} aria-label={`Question ${index + 1}${answers[index] !== null ? ", answered" : ", unanswered"}${review[index] ? ", marked for review" : ""}`}>{index + 1}</button>)}</div><div className="cbt-legend"><span><i className="legend-answered"/>Answered</span><span><i className="legend-marked"/>Review</span><span><i className="legend-unanswered"/>Not answered</span></div><div className="cbt-session-note"><b>Take your time.</b><small>You can return to any question before submitting.</small></div></aside><div className="cbt-current-question"><div className="cbt-question-meta"><span>{item.subject}</span><span>{item.topic}</span><span>Question {current + 1}</span></div><p className="cbt-question-text">{item.text}</p><div className="cbt-answer-options">{item.options.map((option, index) => <button key={option} className={`cbt-answer-option${answers[current] === index ? " cbt-option-picked" : ""}`} onClick={() => setAnswers((value) => value.map((answer, at) => at === current ? index : answer))} type="button" aria-pressed={answers[current] === index}><span>{String.fromCharCode(65 + index)}</span>{option}{answers[current] === index && <b>✓</b>}</button>)}</div><button type="button" className={`cbt-review-toggle${review[current] ? " is-marked" : ""}`} onClick={() => setReview((value) => value.map((marked, at) => at === current ? !marked : marked))}>{review[current] ? "★ &nbsp;Marked for review" : "☆ &nbsp;Mark for review"}</button><div className="cbt-question-controls"><button type="button" className="button button-outline" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0}>← &nbsp;Previous</button><button type="button" className="button" onClick={() => setCurrent((value) => Math.min(questions.length - 1, value + 1))} disabled={current === questions.length - 1}>Next question &nbsp;→</button></div><div className="cbt-submit-row"><span>{answered} answered · {questions.length - answered} remaining</span><button type="button" onClick={() => setConfirm(true)}>Submit session</button></div></div></div>{confirm && <div className="cbt-confirm-backdrop" role="presentation"><div className="cbt-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><span className="confirm-icon">?</span><h2 id="confirm-title">Submit this practice session?</h2><p>You’ve answered {answered} of {questions.length} questions. You can still go back and review your answers before submitting.</p><div><button type="button" className="button button-outline" onClick={() => setConfirm(false)}>Keep practising</button><button type="button" className="button" onClick={finish}>Submit answers</button></div></div></div>}</section>;
}
