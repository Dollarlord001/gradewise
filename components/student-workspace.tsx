"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/ui";
import { initialStudentState, practiceQuestions, studentSubjects, demoTopics, type StudentDemoState } from "@/lib/student-demo";
import { MobileBottomNav } from "@/components/interactive-practice";
import { firebaseAuth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";

export type WorkspaceMode = "dashboard" | "learn" | "practice" | "ai-tutor" | "mistake-bank" | "progress" | "planner";
const storageKey = "tutor-me-student-demo-v1";
const studyTypes = ["Lesson", "Study notes", "Flashcards", "Video lessons"];
const plannerActivities = [
  { time: "09:00", name: "Review Organic Chemistry", subject: "Chemistry", length: "15 min", type: "Practice" },
  { time: "09:20", name: "Quadratic Equations: roots and factors", subject: "Mathematics", length: "20 min", type: "Lesson" },
  { time: "09:45", name: "Retry questions from your mistake bank", subject: "Mixed", length: "10 min", type: "Review" },
];

function useStudentState() {
  const [student, setStudent] = useState<StudentDemoState>(initialStudentState);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      // Hydrate explicitly persisted browser state after mount to avoid server/client markup drift.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setStudent({ ...initialStudentState, ...JSON.parse(stored) as Partial<StudentDemoState> });
    } catch { /* The demo can continue with the in-memory sample state. */ }
    setLoaded(true);
    let live = true;
    fetch("/api/cbt/me", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return null;
      return await response.json() as { profile?: { displayName?: string }; studentProfile?: { exam?: string; target_score?: number; study_minutes_per_day?: number; preferences?: Record<string, unknown> }; subjects?: string[] };
    }).then((account) => {
      if (!live || !account?.studentProfile) return;
      setStudent((current) => ({
        ...current,
        learnerName: account.profile?.displayName ?? current.learnerName,
        exam: account.studentProfile?.exam ?? current.exam,
        target: account.studentProfile?.target_score ?? current.target,
        subjects: account.subjects ?? current.subjects,
        weeklyStudyHours: Math.round((account.studentProfile?.study_minutes_per_day ?? 0) * 7 / 60 * 10) / 10,
      }));
    }).catch(() => { /* A signed-in workspace still renders; account data can retry next visit. */ });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    if (loaded) window.localStorage.setItem(storageKey, JSON.stringify(student));
  }, [loaded, student]);
  return [student, setStudent, loaded] as const;
}

function PageTitle({ eyebrow, title, copy, aside }: { eyebrow: string; title: string; copy: string; aside?: React.ReactNode }) {
  return <div className="workspace-page-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{aside}</div>;
}

export function StudentWorkspace({ mode }: { mode: WorkspaceMode }) {
  const router = useRouter();
  const [student, setStudent] = useStudentState();
  const [completed, setCompleted] = useState<string[]>([]);

  return <div className="student-workspace">
    <div className="workspace-demo-notice"><span>i</span>Account progress comes from completed CBT attempts. <button type="button" className="quiet-link" onClick={async () => { await signOut(firebaseAuth()); await fetch("/api/auth/session", { method: "DELETE" }); router.replace("/signin"); router.refresh(); }}>Sign out</button></div>
    {mode === "dashboard" && <Dashboard student={student} />}
    {mode === "learn" && <LearnLibrary exam={student.exam} subjects={student.subjects} completed={[...student.completedLessons, ...completed]} onComplete={(name) => { setCompleted((previous) => previous.includes(name) ? previous : [...previous, name]); setStudent((previous) => ({ ...previous, completedLessons: previous.completedLessons.includes(name) ? previous.completedLessons : [...previous.completedLessons, name] })); }} />}
    {mode === "practice" && <ProductionPracticeBuilder />}
    {mode === "ai-tutor" && <TutorRoom student={student} />}
    {mode === "mistake-bank" && <CbtMistakeBank />}
    {mode === "progress" && <AccountProgressReport />}
    {mode === "planner" && <StudyPlanner student={student} setStudent={setStudent} />}
    <MobileBottomNav />
  </div>;
}

function Dashboard({ student }: { student: StudentDemoState }) {
  const [data, setData] = useState<{ progress: Array<{ exam: string; subject: string; attempts: number; correct: number }>; mistakes: unknown[]; mistakeCount: number; topics: Array<{ mastery: number; topics: { subject: string; name: string } }> } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let live = true; fetch("/api/cbt/progress", { cache: "no-store" }).then(async (r) => { const body = await r.json(); if (!r.ok) throw new Error(body.error ?? "Progress is unavailable."); if (live) setData(body); }).catch((e: unknown) => { if (live) setError(e instanceof Error ? e.message : "Progress is unavailable."); }); return () => { live = false; }; }, []);
  const totalAttempts = data?.progress.reduce((sum, item) => sum + item.attempts, 0) ?? 0;
  const totalCorrect = data?.progress.reduce((sum, item) => sum + item.correct, 0) ?? 0;
  const weakTopics = [...(data?.topics ?? [])].filter((item) => item.mastery < 60).sort((a, b) => a.mastery - b.mastery).slice(0, 3);
  return <>
    <PageTitle eyebrow="STUDENT DASHBOARD" title={`Welcome back, ${student.learnerName || "student"}.`} copy="Your examination progress is calculated from completed CBT attempts synced to your account." aside={<span className="local-badge">{data ? "ACCOUNT DATA" : "LOADING ACCOUNT DATA"}</span>} />
    {error && <div className="cbt-notice" role="status">{error} Account progress will appear after a completed CBT syncs.</div>}
    {!error && data && totalAttempts === 0 && <section className="workspace-panel"><h2>No completed CBT progress yet</h2><p>Results, subject progress and mistakes will appear here after you complete and sync a CBT.</p><Link className="button" href="/cbt">Start a CBT</Link></section>}
    {data && totalAttempts > 0 && <><div className="progress-stat-grid"><StatTile label="QUESTIONS ATTEMPTED" value={String(totalAttempts)} foot="From completed CBT attempts" tone="blue"/><StatTile label="CORRECT ANSWERS" value={String(totalCorrect)} foot="Persisted question attempts" tone="green"/><StatTile label="PRACTICE ACCURACY" value={`${Math.round(totalCorrect / totalAttempts * 100)}%`} foot="Correct / attempted questions" tone="gold"/><StatTile label="MISTAKES TO REVIEW" value={String(data.mistakeCount)} foot="Unique questions missed" tone="purple"/></div><section className="workspace-panel"><div className="workspace-panel-heading"><div><span className="eyebrow">SUBJECT PROGRESS</span><h2>Your recorded practice</h2></div><Link href="/progress">View progress ↗</Link></div>{data.progress.map((row) => <div className="recent-practice-row" key={`${row.exam}-${row.subject}`}><span className="practice-result-icon result-good">✓</span><span><strong>{row.subject}</strong><small>{row.exam} · {row.attempts} questions attempted</small></span><b>{row.attempts ? Math.round(row.correct / row.attempts * 100) : 0}%</b></div>)}</section><section className="workspace-panel"><div className="workspace-panel-heading"><div><span className="eyebrow">TOPICS TO REVISIT</span><h2>Areas with lower recorded mastery</h2></div><Link href="/cbt">Practise ↗</Link></div>{weakTopics.length ? weakTopics.map((row) => <Link className="recent-practice-row" key={`${row.topics.subject}-${row.topics.name}`} href={`/cbt?practice=1&subject=${encodeURIComponent(row.topics.subject)}&topic=${encodeURIComponent(row.topics.name)}&count=10`}><span className="practice-result-icon result-review">↻</span><span><strong>{row.topics.name}</strong><small>Review this topic → Practice 10 questions</small></span><b>{row.mastery}%</b></Link>) : <p>No weak topic recommendation is available from recorded attempts yet.</p>}</section></>}
    <section className="workspace-section"><div className="workspace-section-heading"><div><span className="eyebrow">QUICK START</span><h2>Choose your next step.</h2></div></div><div className="quick-actions-grid"><QuickAction icon="▣" title="Practice CBT" copy="Choose a subject, mapped topic and question count." href="/cbt" tone="green"/><QuickAction icon="↻" title="Mistake Bank" copy="Review questions you previously missed." href="/mistake-bank" tone="gold"/></div></section>
  </>;
}

function QuickAction({ icon, title, copy, href, tone }: { icon: string; title: string; copy: string; href: string; tone: string }) {
  return <Link className="quick-action-card" href={href}><span className={`quick-action-icon tone-${tone}`}>{icon}</span><span><strong>{title}</strong><small>{copy}</small></span><b aria-hidden="true">↗</b></Link>;
}

function ProductionPracticeBuilder() {
  return <><PageTitle eyebrow="PRACTICE CBT" title="Practise with a purpose." copy="Choose a subject, select an available topic and start a saved CBT session." /><section className="workspace-panel"><h2>Practice from the question bank</h2><p>Practice sessions use reviewed questions available for your selected subject. A topic session starts only when enough mapped questions are available.</p><Link href="/cbt" className="button">Set up CBT practice <span>→</span></Link></section></>;
}

function AccountProgressReport() {
  const [data, setData] = useState<{ progress: Array<{ exam: string; subject: string; attempts: number; correct: number }>; topics: Array<{ mastery: number; topics: { subject: string; name: string } }> } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let live = true; fetch("/api/cbt/progress", { cache: "no-store" }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Progress is unavailable."); if (live) setData(body); }).catch((cause: unknown) => { if (live) setError(cause instanceof Error ? cause.message : "Progress is unavailable."); }); return () => { live = false; }; }, []);
  const attempts = data?.progress.reduce((sum, row) => sum + row.attempts, 0) ?? 0;
  const correct = data?.progress.reduce((sum, row) => sum + row.correct, 0) ?? 0;
  return <><PageTitle eyebrow="PROGRESS & MASTERY" title="Your recorded CBT progress." copy="Subject and topic summaries are calculated from submitted examinations." />{error && <div className="cbt-notice" role="status">{error}</div>}{!data && !error && <p>Loading your account progress…</p>}{data && attempts === 0 && <section className="workspace-panel"><h2>No completed CBT progress yet</h2><p>Your subject performance and topic mastery will appear after you complete and sync a CBT.</p><Link className="button" href="/cbt">Start a CBT</Link></section>}{data && attempts > 0 && <><div className="progress-stat-grid"><StatTile label="QUESTIONS ATTEMPTED" value={String(attempts)} foot="From completed CBT attempts" tone="blue"/><StatTile label="CORRECT ANSWERS" value={String(correct)} foot="Persisted question attempts" tone="green"/><StatTile label="PRACTICE ACCURACY" value={`${Math.round(correct / attempts * 100)}%`} foot="Correct / attempted questions" tone="gold"/></div><div className="progress-detail-grid"><section className="workspace-panel"><div className="workspace-panel-heading"><div><span className="eyebrow">SUBJECT PERFORMANCE</span><h2>Recorded examination results</h2></div></div>{data.progress.map((row) => <div className="recent-practice-row" key={`${row.exam}-${row.subject}`}><span><strong>{row.subject}</strong><small>{row.exam} · {row.attempts} questions</small></span><b>{row.attempts ? Math.round(row.correct / row.attempts * 100) : 0}%</b></div>)}</section><section className="workspace-panel"><div className="workspace-panel-heading"><div><span className="eyebrow">TOPIC MASTERY</span><h2>From verified syllabus mappings</h2></div></div>{data.topics.map((row) => <div className="mastery-row" key={`${row.topics.subject}-${row.topics.name}`}><span><strong>{row.topics.name}</strong><small>{row.topics.subject}</small></span><div className="mastery-meter"><i style={{ width: `${row.mastery}%` }}/></div><b>{row.mastery}%</b></div>)}{data.topics.length === 0 && <p>No topic-mapped CBT results yet.</p>}</section></div></>}</>;
}

function LearnLibrary({ exam, subjects, completed, onComplete }: { exam: string; subjects: string[]; completed: string[]; onComplete: (name: string) => void }) {
  const [subject, setSubject] = useState(subjects.find((item) => item === "Chemistry") ?? subjects[0] ?? "Chemistry");
  const [tab, setTab] = useState("Lesson");
  const [topicIndex, setTopicIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const selectedSubject = new URLSearchParams(window.location.search).get("subject");
    // Read the requested subject from a navigation URL once on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedSubject) setSubject(selectedSubject);
  }, [subjects]);
  const availableTopics = demoTopics.filter((topic) => topic.subject === subject);
  const topics = availableTopics.length ? availableTopics : [{ subject, topic: `${subject} syllabus overview`, subtopic: "Key ideas, objectives and revision practice", mastery: 42, duration: "10 min", kind: "Lesson" }];
  const topic = topics[topicIndex % topics.length];
  return <>
    <PageTitle eyebrow="MY LEARNING" title="Learn at your own pace." copy={`Follow your ${exam} syllabus from subject to topic, with lessons, notes, flashcards and video lesson architecture.`} aside={<span className="local-badge">SAMPLE LIBRARY</span>} />
    <div className="learn-library-layout"><aside className="learn-subject-sidebar"><span className="mini-label">YOUR SUBJECTS</span>{subjects.map((subjectName) => { const stats = studentSubjects.find((item) => item.name === subjectName); const topicCount = demoTopics.filter((item) => item.subject === subjectName).length || 1; return <button type="button" key={subjectName} className={subject === subjectName ? "learn-subject selected-learn-subject" : "learn-subject"} onClick={() => { setSubject(subjectName); setTopicIndex(0); setFlipped(false); }}><span className="subject-mini">{subjectName.slice(0, 1)}</span><span><strong>{subjectName}</strong><small>{topicCount} sample {topicCount === 1 ? "topic" : "topics"} · {stats?.mastery ?? 42}% demo mastery</small></span><b>›</b></button>;})}<Link href="/exams">+ Add a subject</Link></aside>
      <div className="learn-content"><div className="learn-content-heading"><div><span className="eyebrow">{studentSubjects.find((item) => item.name === subject)?.name.toUpperCase()} · SYLLABUS</span><h2>{topic.topic}</h2><p>{topic.subtopic}</p></div><span className="mastery-pill">{topic.mastery}% topic mastery</span></div><div className="learn-tabs" role="tablist" aria-label="Study materials">{studyTypes.map((item) => <button type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active-learn-tab" : ""} key={item} onClick={() => { setTab(item); setFlipped(false); }}>{item}</button>)}</div>
        {tab === "Lesson" && <article className="lesson-card"><div className="lesson-meta"><span>LESSON 1 · {topic.duration.toUpperCase()}</span><span className="demo-label">SAMPLE LESSON</span></div><h3>{topic.topic}: the main idea</h3><p className="lesson-lead">Start with the central idea, then use examples to see how the topic works in an examination question.</p><div className="lesson-callout"><span>KEY IDEA</span><p>{topic.subject === "Chemistry" ? "Alkanes are saturated hydrocarbons: carbon atoms are joined by single bonds, and the remaining valencies are filled by hydrogen atoms." : topic.subject === "Mathematics" ? "A quadratic equation has the form ax² + bx + c = 0, where a is not zero. Factoring turns it into two simpler factors." : topic.subject === "Biology" ? "A cell is the basic structural and functional unit of life. Different organelles carry out specific tasks that keep the cell working." : `Start with the meaning of ${topic.topic.toLowerCase()}, connect the topic to its syllabus objective, then practise recalling the key points.`}</p></div><h4>What to remember</h4><ul><li>Identify the key term and its meaning.</li><li>Connect the idea to the syllabus objective.</li><li>Use practice questions to check your understanding.</li></ul><div className="lesson-foot"><span>SYLLABUS OBJECTIVE · {topic.subtopic}</span><Link href={`/practice?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic.topic)}`}>Practise this topic →</Link></div><button className="lesson-complete-button" type="button" onClick={() => onComplete(topic.topic)}>{completed.includes(topic.topic) ? "✓ Lesson complete" : "Mark lesson complete"}</button></article>}
        {tab === "Study notes" && <article className="lesson-card material-card"><span className="eyebrow">QUICK STUDY NOTE</span><h3>{topic.topic}: revision points</h3><div className="note-item"><b>01</b><span><strong>Start with the definition</strong><small>Explain the idea in your own words before memorising details.</small></span></div><div className="note-item"><b>02</b><span><strong>Know how it appears in questions</strong><small>Look for command words, diagrams and the information given.</small></span></div><div className="note-item"><b>03</b><span><strong>Check your understanding</strong><small>Try a question without looking at the notes, then review the explanation.</small></span></div><Link className="button" href="/practice">Practise from this note <span>→</span></Link></article>}
        {tab === "Flashcards" && <article className="lesson-card flashcard-area"><span className="eyebrow">FLASHCARD · 1 OF 6</span><button type="button" className="flashcard" onClick={() => setFlipped(!flipped)} aria-label={flipped ? "Show flashcard question" : "Reveal flashcard answer"}><span>{flipped ? "ANSWER" : "QUESTION"}</span><strong>{flipped ? `${topic.subtopic}: ${topic.topic}. Remember the central idea, then check your recall against a question.` : `What is one key idea to remember about ${topic.topic}?`}</strong><small>Tap to {flipped ? "see question" : "reveal answer"}</small></button><div className="flashcard-controls"><button className="button button-outline" type="button" onClick={() => setFlipped(false)}>I need to review</button><button className="button" type="button" onClick={() => { setFlipped(false); setTopicIndex((index) => index + 1); }}>I know this →</button></div></article>}
        {tab === "Video lessons" && <article className="lesson-card video-library-card"><div className="video-poster"><span>▶</span><small>LESSON PLAYBACK ARCHITECTURE</small></div><h3>Watch a guided explanation</h3><p>Recorded lesson playback will connect to the study library. The lesson outline and transcript will remain available for low-data revision.</p><div className="video-chapter"><span>01</span><strong>Key terms and definitions</strong><small>4 min</small></div><div className="video-chapter"><span>02</span><strong>Worked example</strong><small>6 min</small></div><div className="video-chapter"><span>03</span><strong>Check your understanding</strong><small>3 min</small></div><small className="local-feature-note">Sample chapter list only · no video is streamed in this demo.</small></article>}
        <div className="learn-next-row"><span>UP NEXT IN THE SYLLABUS</span><button type="button" onClick={() => { setTopicIndex((index) => index + 1); setTab("Lesson"); }}>Next topic: {topics[(topicIndex + 1) % topics.length]?.topic ?? "Review"} <b>→</b></button></div>
      </div></div>
  </>;
}

function PracticeBuilder({ student, setStudent }: { student: StudentDemoState; setStudent: React.Dispatch<React.SetStateAction<StudentDemoState>> }) {
  const [exam, setExam] = useState(student.exam);
  const [subject, setSubject] = useState(student.subjects.includes("Chemistry") ? "Chemistry" : student.subjects[0] ?? "Chemistry");
  const [topic, setTopic] = useState(demoTopics.find((item) => item.subject === (student.subjects.includes("Chemistry") ? "Chemistry" : student.subjects[0]))?.topic ?? "Organic Chemistry");
  const [difficulty, setDifficulty] = useState("Any difficulty");
  const [count, setCount] = useState("10 questions");
  const [mode, setMode] = useState("By topic");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [similar, setSimilar] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [lastSession, setLastSession] = useState<{ correct: number; answered: number; mode: string } | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("mode");
    const requestedSubject = params.get("subject");
    const requestedTopic = params.get("topic");
    // Apply URL-provided practice context after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (requestedSubject) setSubject(requestedSubject);
    if (requestedTopic) setTopic(requestedTopic);
    if (requested === "mistakes") setMode("Mistakes");
    if (requested === "weak-topics") setMode("Weak topics");
    if (requested === "similar") setMode("Random");
  }, []);
  const availableQuestions = useMemo(() => {
    if (mode === "Mistakes") return student.mistakes.map((mistake) => mistake.questionSnapshot ?? practiceQuestions.find((item) => item.id === mistake.questionId)).filter((item): item is (typeof practiceQuestions)[number] => item !== undefined && item.exam === exam);
    if (mode === "Weak topics") return practiceQuestions.filter((item) => item.exam === exam && student.weakTopics.includes(item.topic) && item.subject === subject);
    const pool = mode === "Random" ? practiceQuestions.filter((item) => item.exam === exam) : practiceQuestions.filter((item) => item.exam === exam && item.subject === subject && (item.topic === topic || item.subtopic === topic));
    return pool.filter((item) => difficulty === "Any difficulty" || item.difficulty.toLowerCase() === difficulty.toLowerCase());
  }, [difficulty, exam, mode, student.mistakes, student.weakTopics, subject, topic]);
  const question = availableQuestions[index % Math.max(1, availableQuestions.length)] ?? practiceQuestions[0];
  const questionLimit = Number.parseInt(count, 10);
  const sessionLimit = mode === "Mistakes" ? availableQuestions.length : questionLimit;
  const activeQuestion = similar ? { ...question, id: `${question.id}-similar`, prompt: question.subject === "Chemistry" ? "Which statement best describes an alkane?" : `Try a similar ${question.topic} question: ${question.prompt}`, options: question.subject === "Chemistry" ? ["It contains a carbon–carbon double bond", "It is a saturated hydrocarbon", "It contains only oxygen atoms", "It is an aromatic compound"] : question.options, answerIndex: question.subject === "Chemistry" ? 1 : question.answerIndex, explanation: question.subject === "Chemistry" ? "An alkane is saturated because the carbon atoms are joined by single bonds only." : question.explanation } : question;
  function checkAnswer() {
    if (selected === null || checked) return;
    setChecked(true);
    if (selected === activeQuestion.answerIndex) setSessionCorrect((value) => value + 1);
    setStudent((state) => ({ ...state, questionCount: state.questionCount + 1, correctCount: state.correctCount + (selected === activeQuestion.answerIndex ? 1 : 0), weakTopics: selected === activeQuestion.answerIndex ? state.weakTopics : state.weakTopics.includes(activeQuestion.topic) ? state.weakTopics : [activeQuestion.topic, ...state.weakTopics], mistakes: mode === "Mistakes" && selected === activeQuestion.answerIndex ? state.mistakes.filter((mistake) => mistake.questionId !== activeQuestion.id) : selected === activeQuestion.answerIndex ? state.mistakes : [{ questionId: activeQuestion.id, selected, date: "Today · just now", attempt: (state.mistakes.find((item) => item.questionId === activeQuestion.id)?.attempt ?? 0) + 1, questionSnapshot: activeQuestion }, ...state.mistakes.filter((mistake) => mistake.questionId !== activeQuestion.id)] }));
  }
  function nextQuestion() {
    if (index + 1 >= sessionLimit) {
      setLastSession({ correct: sessionCorrect, answered: sessionLimit, mode });
      setStarted(false); setSessionCorrect(0); setIndex(0); setSelected(null); setChecked(false); setSimilar(false);
      return;
    }
    setIndex((value) => value + 1); setSelected(null); setChecked(false); setSimilar(false);
  }
  return <>
    <PageTitle eyebrow="PRACTICE STUDIO" title="Practise with a purpose." copy="Build a set for your exam, learn from each answer and keep questions you miss for another try." aside={<span className="local-badge">ORIGINAL DEMO QUESTIONS</span>} />
    <div className="practice-mode-tabs" role="tablist" aria-label="Practice modes">{["By topic", "Random", "Weak topics", "Mistakes", "AI-generated"].map((item) => <button type="button" role="tab" aria-selected={mode === item} className={mode === item ? "active-practice-mode" : ""} onClick={() => { setMode(item); setStarted(false); }} key={item}>{item}{item === "AI-generated" && <small>DEMO</small>}</button>)}</div>
    {!started ? <div className="practice-builder-grid"><section className="practice-builder-card">{lastSession && <div className="practice-session-result"><b>Last set complete</b><span>{lastSession.correct} of {lastSession.answered} correct · {lastSession.mode}</span><Link href="/progress">Review progress →</Link></div>}<span className="eyebrow">SET UP A PRACTICE SESSION</span><h2>{mode === "Weak topics" ? "Work on topics to revisit." : mode === "Mistakes" ? "Retry questions you missed." : mode === "AI-generated" ? "Create a fresh practice set." : mode === "Random" ? "Mix it up with random practice." : "Choose what to practise."}</h2><p>{mode === "AI-generated" ? "This demo uses original sample questions. Generated questions need an AI service and review workflow before use." : "Change a filter to shape a question set around the time you have."}</p><div className="practice-filter-grid"><label>Exam<select value={exam} onChange={(event) => setExam(event.target.value)}>{["JAMB", "WAEC", "NECO", "BECE"].map((name) => <option key={name}>{name}</option>)}</select></label><label>Subject<select value={subject} onChange={(event) => { setSubject(event.target.value); setTopic(demoTopics.find((item) => item.subject === event.target.value)?.topic ?? ""); }}>{student.subjects.map((name) => <option key={name}>{name}</option>)}</select></label><label>Topic<select value={topic} onChange={(event) => setTopic(event.target.value)}>{demoTopics.filter((item) => item.subject === subject).map((item) => <option key={item.topic}>{item.topic}</option>)}</select></label><label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>{["Any difficulty", "Easy", "Medium", "Hard"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Question count<select value={count} onChange={(event) => setCount(event.target.value)}>{["5 questions", "10 questions", "15 questions", "20 questions"].map((value) => <option key={value}>{value}</option>)}</select></label></div><div className="question-provenance-note"><span>✓</span>Original TUTOR-ME samples · No official past questions in this demo</div>{availableQuestions.length === 0 && <p className="practice-no-questions">There are no sample questions for this selection yet. Try a different subject or mode.</p>}<button type="button" className="button practice-start" disabled={availableQuestions.length === 0} onClick={() => { setStarted(true); setIndex(0); setSelected(null); setChecked(false); setSessionCorrect(0); }}>{mode === "Mistakes" ? "Start mistake review" : `Start ${mode.toLowerCase()} practice`} <span>→</span></button></section><aside className="practice-session-summary"><span className="mini-label">YOUR SESSION</span><div className="session-summary-item"><span>EXAM</span><strong>{exam}</strong></div><div className="session-summary-item"><span>SUBJECT</span><strong>{subject}</strong></div><div className="session-summary-item"><span>FOCUS</span><strong>{mode === "Weak topics" ? student.weakTopics.join(", ") : mode === "Mistakes" ? `${availableQuestions.length} saved for review` : topic}</strong></div><div className="session-summary-item"><span>QUESTION COUNT</span><strong>{mode === "Mistakes" ? `${availableQuestions.length} saved` : count}</strong></div><div className="session-summary-tip"><b>Why practice this way?</b><small>Focused practice helps you find what you know and what you can work on next.</small></div></aside></div> : <section className="question-workspace"><div className="question-workspace-top"><div><span className="eyebrow">{exam} · {activeQuestion.subject} · {topic}</span><h2>{mode} practice</h2></div><button type="button" className="text-button" onClick={() => setStarted(false)}>Change practice filters</button></div><ProgressBar value={Math.round(((index + (checked ? 1 : 0)) / sessionLimit) * 100)} label={`Question ${index + 1} of ${sessionLimit}`} /><div className="question-workspace-body"><div className="question-workspace-main"><div className="question-workspace-meta"><span>{activeQuestion.topic}</span><span>{activeQuestion.difficulty}</span><span>Original practice</span></div><h3>{activeQuestion.prompt}</h3><div className="workspace-answer-list">{activeQuestion.options.map((option, optionIndex) => <button type="button" key={option} aria-pressed={selected === optionIndex} onClick={() => { if (!checked) setSelected(optionIndex); }} className={`workspace-answer${selected === optionIndex ? " answer-picked" : ""}${checked && optionIndex === activeQuestion.answerIndex ? " answer-is-correct" : ""}${checked && selected === optionIndex && selected !== activeQuestion.answerIndex ? " answer-is-wrong" : ""}`}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}<b>{checked && optionIndex === activeQuestion.answerIndex ? "✓" : checked && selected === optionIndex ? "×" : ""}</b></button>)}</div>{checked && <div className={`workspace-explanation${selected === activeQuestion.answerIndex ? " explanation-correct" : " explanation-review"}`}><strong>{selected === activeQuestion.answerIndex ? "Correct. Keep that reasoning." : "Not quite. Let’s understand why."}</strong><p>{activeQuestion.explanation}</p><small>Objective: {activeQuestion.objective}</small></div>}<div className="question-workspace-actions">{!checked ? <button className="button" type="button" disabled={selected === null} onClick={checkAnswer}>Check answer <span>✓</span></button> : <><button type="button" className="button button-outline" onClick={() => { setSelected(null); setChecked(false); }}>Retry this question</button><button type="button" className="button" onClick={nextQuestion}>{index + 1 === sessionLimit ? "Finish set" : "Next question"} <span>{index + 1 === sessionLimit ? "✓" : "→"}</span></button></>}</div></div><aside className="question-help-panel"><span className="mini-label">WHEN YOU NEED MORE HELP</span><Link href="/ai-tutor" className="question-help-action"><span>✳</span><b>Ask the AI Tutor</b><small>Explore a step in this explanation.</small><i>↗</i></Link><button type="button" className="question-help-action" onClick={() => { setSimilar(true); setSelected(null); setChecked(false); }}><span>⌁</span><b>Try a similar question</b><small>Practise the same idea again.</small><i>→</i></button><div className="question-help-flag">{student.mistakes.some((item) => item.questionId === activeQuestion.id) ? "↻ Saved in your mistake bank" : "Your missed questions are saved locally for review."}</div></aside></div><div className="question-source-foot">Question ID: {activeQuestion.id} · Rights: original TUTOR-ME demo content · Year: not applicable</div></section>}
  </>;
}

function CbtMistakeBank() {
  type Row = { question_id: string; selected_answer: unknown; correct_answer: unknown; times_missed: number; last_seen: string; questions: { prompt: string; options: Record<string, string>; explanation: string | null; exam: string; subject: string; topic_id: string | null; topics: { name: string } | null } };
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("All subjects");
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/cbt/progress?includeMistakes=1&mistakeOffset=${offset}`, { cache: "no-store" });
        const body = await response.json();
        if (response.status === 401) throw new Error("Sign in to view your account Mistake Bank.");
        if (!response.ok) throw new Error(body.error ?? "Mistake Bank is unavailable.");
        if (live) { setRows((previous) => offset ? [...previous, ...(body.mistakes ?? [])] : (body.mistakes ?? [])); setHasMore(Boolean(body.mistakesHasMore)); setLoadError(""); }
      } catch (error) {
        if (navigator.onLine) { if (live) { setOffline(false); setLoadError(error instanceof Error ? error.message : "Mistake Bank is unavailable."); } }
        else {
          setOffline(true);
          try {
            const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open("tutor-me-cbt", 4); request.onupgradeneeded = () => { const store = request.result; if (!store.objectStoreNames.contains("attempts")) store.createObjectStore("attempts", { keyPath: "id" }); if (!store.objectStoreNames.contains("studentMistakes")) store.createObjectStore("studentMistakes", { keyPath: "studentQuestionKey" }); if (!store.objectStoreNames.contains("identity")) store.createObjectStore("identity", { keyPath: "id" }); if (!store.objectStoreNames.contains("syllabusTopics")) store.createObjectStore("syllabusTopics", { keyPath: "id" }); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
            const getAll = (name: string) => new Promise<unknown[]>((resolve) => { const req = db.transaction(name).objectStore(name).getAll(); req.onsuccess = () => resolve(req.result); req.onerror = () => resolve([]); });
            const [mistakes, attempts, identities] = await Promise.all([getAll("studentMistakes"), getAll("attempts"), getAll("identity")]); db.close();
            const studentId = (identities as Array<{ id: string; studentId: string }>).find((item) => item.id === "currentStudent")?.studentId;
            const local = (mistakes as Array<{ studentId: string; questionId: string; timesMissed: number; selectedAnswer: string; correctAnswer: string; lastSeen: number }>).filter((item) => item.studentId === studentId).flatMap((mistake) => {
              const question = (attempts as Array<{ studentId: string; questions: Array<{ id: string; prompt: string; options: Array<{ id: string; text: string }>; explanation: string | null; subject: string; topic: string | null }> }>).filter((attempt) => attempt.studentId === studentId).flatMap((attempt) => attempt.questions ?? []).find((item) => item.id === mistake.questionId);
              return question ? [{ question_id: mistake.questionId, selected_answer: mistake.selectedAnswer, correct_answer: mistake.correctAnswer, times_missed: mistake.timesMissed, last_seen: new Date(mistake.lastSeen).toISOString(), questions: { prompt: question.prompt, options: Object.fromEntries(question.options.map((option) => [option.id, option.text])), explanation: question.explanation, exam: "JAMB", subject: question.subject, topic_id: null, topics: question.topic ? { name: question.topic } : null } }] : [];
            });
            if (live) { setRows(local); setHasMore(false); setLoadError(""); }
          } catch { if (live) setRows([]); }
        }
        if (live && error instanceof Error) setLoading(false);
      } finally { if (live) setLoading(false); }
    };
    void load(); return () => { live = false; };
  }, [offset]);
  const subjects = [...new Set(rows.map((row) => row.questions.subject))].sort();
  const visible = rows.filter((row) => filter === "All subjects" || row.questions.subject === filter);
  return <><PageTitle eyebrow="MISTAKE BANK" title="Review questions you missed." copy="Repeated mistakes stay grouped by question, with your chosen answer, verified answer and any reviewed explanation." aside={<span className="local-badge">{rows.length} RECORDED MISTAKES</span>} />{offline && <p className="workspace-demo-notice">Offline view · showing this account’s mistake records saved on this device.</p>}{loadError && <div className="cbt-notice" role="status">{loadError}</div>}<div className="mistake-tools"><label>Filter by subject<select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All subjects</option>{subjects.map((name) => <option key={name}>{name}</option>)}</select></label></div>{loading ? <p>Loading your recorded mistakes…</p> : visible.length === 0 ? <section className="mistake-empty-state"><span>✓</span><h2>No recorded mistakes to review.</h2><p>Wrong answers from completed CBT attempts will appear here and remain linked to your progress.</p><Link href="/cbt" className="button">Start a CBT <span>→</span></Link></section> : <div className="mistake-record-list">{visible.map((row) => { const options = row.questions.options ?? {}; const selected = typeof row.selected_answer === "string" ? row.selected_answer : String(row.selected_answer ?? ""); const correct = typeof row.correct_answer === "string" ? row.correct_answer : String(row.correct_answer ?? ""); return <article className="mistake-record" key={row.question_id}><div className="mistake-record-top"><div className="question-workspace-meta"><span>{row.questions.subject}</span><span>{row.questions.topics?.name ?? "Topic not classified"}</span></div><span className="mistake-attempt">Missed {row.times_missed} {row.times_missed === 1 ? "time" : "times"}</span></div><h2>{row.questions.prompt}</h2><div className="mistake-answer-grid"><div className="student-answer"><small>YOUR ANSWER</small><strong>{options[selected] ?? "Not answered"}</strong></div><div className="correct-answer"><small>VERIFIED ANSWER</small><strong>{options[correct] ?? correct}</strong></div></div>{row.questions.explanation && <div className="mistake-explanation"><b>Explanation</b><p>{row.questions.explanation}</p></div>}<div className="mistake-actions"><Link className="button button-outline" href="/cbt">Return to CBT <span>↻</span></Link><span className="mistake-attempt">Last seen {new Date(row.last_seen).toLocaleDateString()}</span></div></article>; })}{hasMore && <button className="button button-outline" type="button" onClick={() => { setLoading(true); setOffset((value) => value + 100); }}>Load more recorded mistakes</button>}</div>}</>;
}

function ProgressReport({ student }: { student: StudentDemoState }) {
  const accuracy = Math.round((student.correctCount / student.questionCount) * 100);
  return <>
    <PageTitle eyebrow="PROGRESS & MASTERY" title="See the work adding up." copy="Use your practice history to understand what is going well and what may need another look." aside={<span className="local-badge">SAMPLE STUDENT DATA</span>} />
    <div className="progress-overall-card"><div><span className="eyebrow">YOUR OVERALL PREPARATION</span><h2>Steady progress, topic by topic.</h2><p>This sample view uses local demo numbers. A connected account would calculate these from your activity.</p></div><div className="progress-overall-ring"><span><strong>68%</strong><small>overall syllabus</small></span></div></div>
    <div className="progress-stat-grid"><StatTile label="PRACTICE ACCURACY" value={`${accuracy}%`} foot="Across sample questions" tone="blue"/><StatTile label="QUESTIONS COMPLETED" value={String(student.questionCount)} foot="This term · demo data" tone="green"/><StatTile label="STUDY TIME" value="18.5 hrs" foot="Over the last 4 weeks" tone="gold"/><StatTile label="CURRENT STREAK" value="12 days" foot="Best this term: 16 days" tone="purple"/></div>
    <div className="progress-detail-grid"><section className="workspace-panel subject-progress-panel"><div className="workspace-panel-heading"><div><span className="eyebrow">SUBJECT PERFORMANCE</span><h2>Strengths and next steps.</h2></div></div>{studentSubjects.map((subject) => <div className="subject-progress-row" key={subject.name}><span className="subject-mini">{subject.name.slice(0, 1)}</span><span className="subject-progress-copy"><strong>{subject.name}</strong><small>{subject.accuracy}% practice accuracy · {subject.mastery}% mastery</small><ProgressBar value={subject.mastery} color={subject.mastery > 70 ? "green" : "blue"}/></span><span className={`performance-tag ${subject.mastery > 70 ? "performance-strong" : "performance-focus"}`}>{subject.mastery > 70 ? "Growing" : "Focus"}</span></div>)}</section><section className="workspace-panel topic-mastery-panel"><div className="workspace-panel-heading"><div><span className="eyebrow">TOPIC MASTERY</span><h2>What to revisit.</h2></div></div>{demoTopics.slice(0, 4).map((topic) => <div className="mastery-row" key={topic.topic}><span><strong>{topic.topic}</strong><small>{topic.subject}</small></span><div className="mastery-meter"><i style={{ width: `${topic.mastery}%` }} /></div><b>{topic.mastery}%</b></div>)}<Link href="/practice" className="weak-retry-link">Practise a weak topic →</Link></section></div>
    <section className="workspace-section weekly-progress"><div className="workspace-section-heading"><div><span className="eyebrow">STUDY RHYTHM</span><h2>A week at a glance.</h2></div><span className="streak-badge">♨ &nbsp;12 day streak</span></div><div className="week-bars" aria-label="Sample study time by day">{[{day:"M",value:54,label:"36 min"},{day:"T",value:76,label:"51 min"},{day:"W",value:62,label:"42 min"},{day:"T",value:35,label:"24 min"},{day:"F",value:88,label:"59 min"},{day:"S",value:24,label:"16 min"},{day:"S",value:8,label:"5 min"}].map((item,index)=><div className="week-day" key={`${item.day}-${index}`}><small>{item.label}</small><i style={{ height: `${item.value}%` }}/><span>{item.day}</span></div>)}</div><p className="chart-disclaimer">Illustrative study time · Local demonstration data</p></section>
    <LeaderboardPreview />
    <div className="progress-footer-actions"><Link href="/mistake-bank" className="quick-action-card"><span className="quick-action-icon tone-gold">↻</span><span><strong>Review {student.mistakes.length} saved mistake</strong><small>Understand the answer and retry it.</small></span><b>↗</b></Link><Link href="/planner" className="quick-action-card"><span className="quick-action-icon tone-blue">▦</span><span><strong>Plan your next study session</strong><small>Choose an activity for today.</small></span><b>↗</b></Link></div>
  </>;
}

function StatTile({ label, value, foot, tone }: { label: string; value: string; foot: string; tone: string }) {
  return <article className="progress-stat-tile"><span className={`stat-tile-icon tile-${tone}`}>◷</span><small>{label}</small><strong>{value}</strong><span>{foot}</span></article>;
}

function LeaderboardPreview() {
  const [group, setGroup] = useState("Class");
  const rankings = group === "National" ? [[1, "Student sample 01", "2,480 pts"], [2, "Student sample 02", "2,190 pts"], [48, "Adaeze · sample learner", "1,560 pts"]] : group === "Friends" ? [[1, "Adaeze · sample learner", "1,560 pts"], [2, "Student sample 01", "1,420 pts"], [3, "Student sample 02", "1,210 pts"]] : [[1, "Student sample 01", "1,720 pts"], [2, "Student sample 02", "1,640 pts"], [8, "Adaeze · sample learner", "1,560 pts"]];
  return <section className="workspace-panel leaderboard-panel"><div className="workspace-panel-heading"><div><span className="eyebrow">FRIENDLY CHALLENGES</span><h2>Celebrate learning effort together.</h2></div><span className="local-badge">SAMPLE BOARD</span></div><div className="leaderboard-tabs" role="tablist" aria-label="Leaderboard group">{["Friends", "Class", "School", "State", "National"].map((item) => <button type="button" role="tab" aria-selected={group === item} className={group === item ? "leaderboard-tab-active" : ""} onClick={() => setGroup(item)} key={item}>{item}</button>)}</div><div className="leaderboard-sample-label">{group} view · sample names and points only; no real rankings</div>{rankings.map(([rank, name, points], index) => <div className={`leaderboard-row${String(name).startsWith("Adaeze") ? " leaderboard-row-you" : ""}`} key={`${group}-${rank}`}><span className="leaderboard-place">{index === 0 ? "✦" : `#${rank}`}</span><span className="leaderboard-person">{name}{String(name).startsWith("Adaeze") && <small>YOU</small>}</span><strong>{points}</strong></div>)}<div className="leaderboard-footnote">Points represent study activity in this interface preview. The leaderboard is not connected to students or schools.</div></section>;
}

function StudyPlanner({ student, setStudent }: { student: StudentDemoState; setStudent: React.Dispatch<React.SetStateAction<StudentDemoState>> }) {
  const goalHours = student.weeklyStudyHours;
  const done = student.activitiesDone;
  const setPlanDate = (value: string) => setStudent((current) => ({ ...current, targetExamDate: value }));
  const setGoalHours = (value: number) => setStudent((current) => ({ ...current, weeklyStudyHours: value }));
  const setDone = (update: (items: string[]) => string[]) => setStudent((current) => ({ ...current, activitiesDone: update(current.activitiesDone) }));
  const recommended = student.weakTopics[0] ?? "Organic Chemistry";
  return <>
    <PageTitle eyebrow="PERSONALISED STUDY PLAN" title="A steady plan for your exam goal." copy="Set the time you have, keep your exam and subjects in view, and use a practical starting routine." aside={<span className="local-badge">LOCAL PLAN DEMO</span>} />
    <div className="planner-layout"><section className="planner-settings-card"><span className="eyebrow">YOUR STUDY SETTINGS</span><h2>Make this plan yours.</h2><p>These settings are local. No adaptive service is connected in this demo.</p><div className="planner-setting-row"><label htmlFor="planner-exam">Exam</label><select id="planner-exam" defaultValue={student.exam} disabled><option>{student.exam} · set in onboarding</option></select></div><div className="planner-setting-row"><label htmlFor="planner-date">My target exam date</label><input id="planner-date" type="date" value={student.targetExamDate} onChange={(event) => setPlanDate(event.target.value)}/><small>Optional personal target · confirm official dates separately</small></div><div className="planner-setting-row"><label htmlFor="planner-score">Target score</label><strong id="planner-score" className="planner-setting-value">{student.target}</strong></div><div className="planner-setting-row"><label htmlFor="planner-hours">Study time per week</label><select id="planner-hours" value={goalHours} onChange={(event) => setGoalHours(Number(event.target.value))}>{[3.5, 5, 7, 10, 14, 21].map((hours) => <option key={hours} value={hours}>{hours} hours</option>)}</select></div><div className="planner-setting-row"><label>Subjects in this plan</label><div className="planner-subject-list">{student.subjects.map((subject) => <span key={subject}>✓ &nbsp;{subject}</span>)}</div></div><div className="planner-weak-note"><b>Focus topics from sample performance</b><span>{student.weakTopics.join(" · ")}</span></div></section><section className="planner-today-card"><div className="workspace-panel-heading"><div><span className="eyebrow">TODAY · SAMPLE PLAN</span><h2>Keep it focused.</h2></div><span className="planner-hours-pill">{goalHours} hrs / week</span></div><p className="planner-adaptive-reason">Recommended because {recommended} is one of your lower-confidence topics, and you have {goalHours} hours a week available.</p><div className="planner-tasks">{plannerActivities.map((activity) => <label className={`planner-task${done.includes(activity.name) ? " planner-task-done" : ""}`} key={activity.name}><input type="checkbox" checked={done.includes(activity.name)} onChange={() => setDone((items) => items.includes(activity.name) ? items.filter((item) => item !== activity.name) : [...items, activity.name])}/><span className="planner-task-time">{activity.time}</span><span className="planner-task-copy"><strong>{activity.name}</strong><small>{activity.subject} · {activity.length} · {activity.type}</small></span><b>{done.includes(activity.name) ? "✓" : ""}</b></label>)}</div><div className="planner-today-foot"><span>Today’s planned study</span><strong>{done.length} of 3 activities</strong><ProgressBar value={Math.round(done.length / 3 * 100)} color="green"/></div></section></div>
    <section className="workspace-section upcoming-plan"><div className="workspace-section-heading"><div><span className="eyebrow">UP NEXT</span><h2>Your coming study rhythm.</h2></div><Link href="/learn">Browse learning library ↗</Link></div><div className="upcoming-plan-grid">{[{day:"TOMORROW",focus:"Nutrition in plants",sub:"Biology · Lesson + 10 questions",time:"25 min"},{day:"DAY 3",focus:"Retry recent mistakes",sub:"Mixed subjects · Mistake review",time:"15 min"},{day:"DAY 4",focus:"Quadratic equations",sub:"Mathematics · Guided practice",time:"30 min"}].map((item) => <article className="upcoming-plan-card" key={item.day}><span>{item.day}</span><strong>{item.focus}</strong><small>{item.sub}</small><b>◷ &nbsp;{item.time}</b></article>)}</div><p className="chart-disclaimer">Sample recommendations use your selected weak topics. A real adaptive plan will need connected progress history and scheduling logic.</p></section>
  </>;
}

function TutorRoom({ student }: { student: StudentDemoState }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [action, setAction] = useState("Explain this");
  const suggested = ["Explain this", "Simplify it", "Show another method", "Give me a similar question", "Make it harder", "Teach me this topic", "Why is my answer wrong?"];
  function send(text: string) { if (!text.trim()) return; setSent((items) => [...items, text.trim()]); setMessage(""); }
  return <>
    <PageTitle eyebrow="YOUR STUDY COMPANION" title="Let’s work through it together." copy="Ask about a question or topic. This local tutor demo uses prepared explanations; no AI service is connected." aside={<span className="local-badge">DEMO RESPONSES · NO AI API</span>} />
    <div className="tutor-layout"><section className="tutor-chat"><div className="tutor-context-bar"><span className="tutor-context-icon">✳</span><span><small>STUDYING NOW</small><strong>Sample question · Chemistry · Organic Chemistry · Alkanes</strong></span><span className="tutor-context-performance">Recent set: 6/10 correct</span></div><div className="tutor-conversation" aria-live="polite"><div className="chat-day-label">TODAY · STUDY SESSION</div><div className="chat-message student-chat"><span className="chat-avatar student-avatar">AM</span><div><small>YOU · JUST NOW</small><p>I keep mixing up alkanes and alkenes. How do I remember the difference?</p></div></div><div className="chat-message tutor-chat"><span className="chat-avatar tutor-avatar">✳</span><div><small>TUTOR-ME STUDY COMPANION · SAMPLE RESPONSE</small><p>Start with the bond between the carbon atoms:</p><ul><li><b>Alkanes</b> have only single carbon–carbon bonds. They are saturated.</li><li><b>Alkenes</b> have at least one carbon–carbon double bond. They are unsaturated.</li></ul><div className="tutor-memory-tip"><b>A simple memory cue</b><br />Alk<strong>en</strong>es have a double bond — think of the extra “e” as an extra bond.</div><p>For an open chain, alkanes follow CₙH₂ₙ₊₂. Alkenes with one double bond follow CₙH₂ₙ.</p><button type="button" className="response-context-link" onClick={() => { setAction("Show another method"); send("Show another method"); }}>Was your answer about the formula? Show another method →</button></div></div>{sent.map((text, index) => <div className="chat-message student-chat" key={`${text}-${index}`}><span className="chat-avatar student-avatar">AM</span><div><small>YOU · JUST NOW</small><p>{text}</p></div></div>)}{sent.length > 0 && <div className="chat-message tutor-chat"><span className="chat-avatar tutor-avatar">✳</span><div><small>LOCAL DEMO RESPONSE</small><p>{action === "Why is my answer wrong?" ? "Let’s look at the idea step by step. Check whether the question asks for the number of carbon atoms, the bond type, or the functional group. I can explain further when a real tutor service is connected." : action === "Give me a similar question" ? "Try this: which formula represents an open-chain alkane with four carbon atoms? Choose the option that follows CₙH₂ₙ₊₂. This is a prepared sample prompt; question checking is not connected here." : `Let’s focus on ${(sent.at(-1) ?? "").toLowerCase().includes("quadratic") ? "Quadratic Equations" : "Organic Chemistry"}. First, identify the key idea in the question. Then connect it to one example and check your understanding with a practice question. This is a prepared local demo response.`}</p><small className="demo-response-note">Prepared interface response · not generated by an AI model</small></div></div>}</div><div className="tutor-suggested-actions"><span>TRY ASKING</span><div>{suggested.map((item) => <button type="button" key={item} className={action === item ? "suggested-action selected-suggestion" : "suggested-action"} onClick={() => { setAction(item); send(item); }}>{item}</button>)}</div></div><form className="tutor-compose" onSubmit={(event) => { event.preventDefault(); send(message); }}><label className="sr-only" htmlFor="tutor-message">Ask about this topic</label><input id="tutor-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about alkanes, this question or a study topic…"/><button type="submit" disabled={!message.trim()} aria-label="Send question">↑</button></form><div className="tutor-input-note">No messages leave this browser in the demo. Voice tutoring is planned for a later phase.</div></section>
      <aside className="tutor-side-panel"><section className="workspace-panel tutor-context-card"><span className="eyebrow">YOUR LEARNING CONTEXT</span><h2>Here’s what you’re working on.</h2><div className="context-detail"><small>EXAM</small><strong>{student.exam} · target {student.target}</strong></div><div className="context-detail"><small>QUESTION CONTEXT · SAMPLE</small><strong>Chemistry · Organic Chemistry</strong></div><div className="context-detail"><small>RECENT PERFORMANCE · SAMPLE</small><strong>6/10 correct in last practice</strong></div><div className="context-detail"><small>TOPICS TO REVISIT</small><strong>{student.weakTopics.join(" · ") || "No weak topics recorded yet"}</strong></div><Link href="/practice">Try a question on this topic ↗</Link></section><div className="tutor-boundary-note"><b>Study help, with clear limits.</b><p>This screen demonstrates how tutoring can use your current topic and recent practice. The responses above are prepared examples, not an AI-generated answer.</p><Link href="/mistake-bank">Open your mistake bank →</Link></div></aside></div>
  </>;
}
