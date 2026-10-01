"use client";

import { useState } from "react";
import Link from "next/link";
import { sampleQuestion } from "@/lib/content";

export function InteractivePractice() {
  const [answer, setAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const question = sampleQuestion;
  return <section className="practice-demo-card"><div className="practice-demo-head"><div><span className="eyebrow">A taste of practice</span><h3>Try a question</h3></div><span className="demo-label">Original sample</span></div><div className="question-meta"><span>{question.exam} practice</span><span>{question.subject}</span><span>{question.topic}</span><span>{question.difficulty}</span></div><p className="question-prompt">{question.prompt}</p><div className="option-list">{question.options.map((option, index) => <button type="button" key={option} className={`option-button${answer === index ? " option-selected" : ""}${showAnswer && index === question.answerIndex ? " option-correct" : ""}${showAnswer && answer === index && answer !== question.answerIndex ? " option-wrong" : ""}`} onClick={() => { setAnswer(index); setShowAnswer(false); }}><span className="option-letter">{String.fromCharCode(65 + index)}</span>{option}<span className="option-state" aria-hidden="true">{showAnswer && index === question.answerIndex ? "✓" : answer === index ? "•" : ""}</span></button>)}</div>{showAnswer && <div className="answer-explanation"><strong>{answer === question.answerIndex ? "That’s right." : "Let’s learn from this one."}</strong><p>{question.explanation}</p><small>Original TUTOR-ME demonstration question · Not an official past question</small></div>}<div className="practice-demo-foot"><span>01 <i>/ 10</i></span><button className="text-button" onClick={() => { if (answer === null) return; setShowAnswer(true); }} type="button" disabled={answer === null}>{showAnswer ? "Answer checked ✓" : "Check answer →"}</button></div></section>;
}

export function MobileBottomNav() {
  return <nav className="mobile-bottom-nav" aria-label="Quick navigation"><Link href="/dashboard"><span>◉</span>Home</Link><Link href="/learn"><span>↗</span>Learn</Link><Link href="/practice"><span>⌁</span>Practice</Link><Link href="/progress"><span>◷</span>Progress</Link></nav>;
}
