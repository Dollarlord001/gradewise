"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { exams } from "@/lib/content";
import { saveStudentOnboardingAction } from "@/app/actions/auth";

const subjectsFor = (examName: string) => exams.find((exam) => exam.name === examName)?.subjects ?? [];

export function StudentOnboarding() {
  const [step, setStep] = useState(0);
  const [exam, setExam] = useState("JAMB");
  const [subjects, setSubjects] = useState<string[]>(["Use of English", "Mathematics", "Chemistry", "Biology"]);
  const [target, setTarget] = useState(320);
  const [firstName, setFirstName] = useState("");
  const [studyTime, setStudyTime] = useState("60");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleSubject(subject: string) {
    setSubjects((current) => current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]);
  }

  function finish() {
    setError("");
    const formData = new FormData();
    formData.set("displayName", firstName);
    formData.set("exam", exam);
    formData.set("target", String(target));
    formData.set("minutes", studyTime);
    subjects.slice(0, 8).forEach((subject) => formData.append("subject", subject));
    startTransition(async () => {
      const result = await saveStudentOnboardingAction(formData);
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  }

  if (saved) return <div className="onboarding-finished"><span className="onboarding-success">✓</span><span className="eyebrow">Study plan saved</span><h2>{exam} preparation, your way.</h2><p>{firstName}, your subjects, target and study rhythm are saved to your account.</p><Link className="button" href="/dashboard">Open my dashboard <span>↗</span></Link></div>;

  return <div className="onboarding-card">
    <div className="onboarding-progress"><span>STEP {step + 1} OF 3</span><div>{[0, 1, 2].map((value) => <i key={value} className={step >= value ? "step-active" : ""}/>)}</div></div>
    {step === 0 && <><span className="eyebrow">First, your exam</span><h2>What are you preparing for?</h2><p>You can update your exam plan later.</p><div className="onboarding-exams">{exams.map((item) => <button type="button" key={item.slug} className={`onboarding-exam${exam === item.name ? " onboarding-selected" : ""}`} onClick={() => { setExam(item.name); setSubjects(item.name === "JAMB" ? ["Use of English", "Mathematics", "Chemistry", "Biology"] : subjectsFor(item.name).slice(0, 4)); }} aria-pressed={exam === item.name}><span className={`exam-card-mark onboarding-mark exam-${item.color}`}>{item.name.slice(0, 1)}</span><span><strong>{item.name}</strong><small>{item.students}</small></span><b>{exam === item.name ? "✓" : ""}</b></button>)}</div></>}
    {step === 1 && <><span className="eyebrow">Your subjects</span><h2>Choose the subjects you’ll study.</h2><p>You can change your choices as your plan develops.</p><div className="onboarding-subjects">{subjectsFor(exam).map((subject) => <button type="button" key={subject} aria-pressed={subjects.includes(subject)} className={subjects.includes(subject) ? "onboarding-subject picked-subject" : "onboarding-subject"} onClick={() => toggleSubject(subject)}><span>{subjects.includes(subject) ? "✓" : "+"}</span>{subject}</button>)}</div><div className="onboarding-inline-note">{subjects.length} selected · Pick at least one subject.</div></>}
    {step === 2 && <><span className="eyebrow">Make it your goal</span><h2>Set a target and study rhythm.</h2><p>This helps shape a useful starting plan. Both can be adjusted later.</p><label className="onboarding-label" htmlFor="learner-name">What should we call you?</label><input id="learner-name" className="onboarding-name-input" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Your first name"/><label className="onboarding-label" htmlFor="target-score">Target score</label><div className="onboarding-range"><input id="target-score" type="range" min="100" max="400" step="10" value={target} onChange={(event) => setTarget(Number(event.target.value))}/><strong>{target}</strong></div><label className="onboarding-label" htmlFor="study-time">Time you can study</label><select id="study-time" value={studyTime} onChange={(event) => setStudyTime(event.target.value)}><option value="30">30 minutes a day</option><option value="60">1 hour a day</option><option value="120">2 hours a day</option><option value="180">3 hours a day</option></select></>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="onboarding-controls">{step > 0 && <button type="button" className="button button-outline" disabled={pending} onClick={() => setStep(step - 1)}>← &nbsp;Back</button>}{step < 2 ? <button type="button" className="button" disabled={step === 1 && subjects.length === 0} onClick={() => setStep(step + 1)}>Continue <span>→</span></button> : <button type="button" className="button" disabled={!firstName.trim() || pending} onClick={finish}>{pending ? "Saving…" : "Build my study plan"} <span>↗</span></button>}</div>
  </div>;
}
