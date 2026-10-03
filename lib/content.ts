export type Exam = {
  slug: string;
  name: string;
  fullName: string;
  description: string;
  subjects: string[];
  window: string;
  students: string;
  color: string;
};

export const exams: Exam[] = [
  { slug: "jamb", name: "JAMB", fullName: "Unified Tertiary Matriculation Examination", description: "Build the subject knowledge, speed and confidence to reach your university admission goal.", subjects: ["Use of English", "Mathematics", "Chemistry", "Biology", "Physics", "Government"], window: "2027 exam preparation", students: "UTME", color: "blue" },
  { slug: "waec", name: "WAEC", fullName: "West African Senior School Certificate Examination", description: "Revise your SSCE subjects topic by topic, with structured practice and clear explanations.", subjects: ["English Language", "Mathematics", "Biology", "Chemistry", "Economics", "Government"], window: "2027 exam preparation", students: "SS1–SS3", color: "green" },
  { slug: "neco", name: "NECO", fullName: "National Examinations Council", description: "Prepare for NECO with syllabus-led lessons, revision materials and timed practice.", subjects: ["English Language", "Mathematics", "Biology", "Chemistry", "Agricultural Science", "Civic Education"], window: "2027 exam preparation", students: "SS1–SS3", color: "gold" },
  { slug: "bece", name: "BECE", fullName: "Basic Education Certificate Examination", description: "Get ready for junior secondary school exams with a steady plan and guided practice.", subjects: ["English Studies", "Mathematics", "Basic Science", "Social Studies", "Basic Technology", "French"], window: "2027 exam preparation", students: "JSS1–JSS3", color: "purple" },
];

export const navLinks = [
  { label: "Exams", href: "/exams" },
  { label: "Learn", href: "/learn" },
  { label: "Practice", href: "/practice" },
  { label: "CBT", href: "/cbt" },
  { label: "Resources", href: "/news" },
];

export const studySteps = [
  { number: "01", title: "Learn with clarity", copy: "Short lessons and syllabus-based notes make difficult topics easier to understand.", symbol: "↗" },
  { number: "02", title: "Practise with purpose", copy: "Work through exam-style questions by subject, topic, year or difficulty.", symbol: "⌁" },
  { number: "03", title: "Understand your gaps", copy: "See where marks are slipping and revisit every question you miss.", symbol: "◉" },
  { number: "04", title: "Improve every day", copy: "A practical daily plan keeps your preparation moving at a steady pace.", symbol: "↟" },
];

export type Question = {
  id: string;
  exam: string;
  year: number | null;
  subject: string;
  paper: string;
  topic: string;
  subtopic: string;
  difficulty: "easy" | "medium" | "hard";
  type: "multiple-choice" | "short-answer";
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  objective: string;
  provenance: { source: string; rights: "original" | "licensed" | "public-domain"; verified: boolean };
};

export type StudyRecommendation = { title: string; reason: string; href: string; duration: string; kind: "lesson" | "practice" | "review" };

export const nextActivity: StudyRecommendation = {
  title: "Review Organic Chemistry", reason: "Your last two sets show this topic needs another look.", href: "/ai-tutor", duration: "12 min", kind: "review",
};

export const destinationContent: Record<string, { eyebrow: string; title: string; intro: string; icon: string; features: string[] }> = {
  exams: { eyebrow: "Choose your exam", title: "Your next step starts here.", intro: "Pick the exam you are preparing for. We’ll help you organise subjects, practise with focus and track your progress.", icon: "⌖", features: ["Explore exam subjects", "Follow a clear syllabus", "Practise at your own pace"] },
  learn: { eyebrow: "Learn", title: "Make every topic make sense.", intro: "Work through clear lessons, focused notes and guided explanations built around the Nigerian curriculum.", icon: "↗", features: ["Syllabus-led topics", "Step-by-step lessons", "Study materials you can revisit"] },
  practice: { eyebrow: "Practice", title: "Turn what you know into marks.", intro: "Choose a subject and topic, answer at your own pace, then use clear explanations to learn from each attempt.", icon: "⌁", features: ["Topic and subject practice", "Timed exam-style sets", "Mistakes saved for review"] },
  cbt: { eyebrow: "Computer-based practice", title: "Get comfortable with the CBT format.", intro: "Practise navigating questions, managing time and checking your answers in a calm exam-style interface.", icon: "▣", features: ["Question navigation", "Timed practice sessions", "Review your answer choices"] },
  "ai-tutor": { eyebrow: "Your study companion", title: "Get a clearer explanation, right when you need it.", intro: "Bring a topic or question to your tutor. Ask for a simpler explanation, a new method or a similar question to try.", icon: "✳", features: ["Explain a difficult step", "Try a different method", "Practise a similar question"] },
  "mistake-bank": { eyebrow: "Mistake bank", title: "Make every wrong answer useful.", intro: "Revisit questions you missed, understand why, and practise again when you’re ready.", icon: "↻", features: ["Review by subject and topic", "See your original answer", "Retry or ask for help"] },
  progress: { eyebrow: "Your progress", title: "See the work adding up.", intro: "Track your practice, study time and topic confidence as you prepare for your exam.", icon: "◷", features: ["Weekly study rhythm", "Subject accuracy", "Topics to revisit"] },
  planner: { eyebrow: "Study planner", title: "A steady plan for your exam goal.", intro: "Set your target, choose when you can study and get a practical next step for each day.", icon: "▦", features: ["Daily study goals", "Exam countdown", "Flexible weekly plan"] },
  dashboard: { eyebrow: "Student dashboard", title: "Good to see you back.", intro: "Pick up where you left off, check your study goal and decide what to work on next.", icon: "◉", features: ["Your learning at a glance", "Today’s next activity", "Recent subject progress"] },
  news: { eyebrow: "Education desk", title: "Useful updates for your next step.", intro: "Find study advice, admissions guidance and education updates. Official notices are linked to their source when available.", icon: "▤", features: ["Study tips", "Admission guidance", "Scholarship opportunities"] },
  admission: { eyebrow: "Admission guidance", title: "Make informed choices about what comes next.", intro: "Explore course requirements, subject combinations and the steps students commonly take towards admission.", icon: "⌂", features: ["Course and subject guide", "Admission checklist", "Official source links"] },
  scholarships: { eyebrow: "Scholarships", title: "Find support for your education journey.", intro: "Browse a carefully organised scholarship directory and check eligibility and deadlines with the provider.", icon: "✦", features: ["Undergraduate opportunities", "Eligibility notes", "Provider links"] },
  signup: { eyebrow: "Start preparing", title: "Build a study routine that works for you.", intro: "Create your student profile to keep your subjects, goals and learning in one place.", icon: "↗", features: ["Choose your exam", "Set a score goal", "Plan your study time"] },
  signin: { eyebrow: "Welcome back", title: "Pick up your preparation.", intro: "Sign in to return to your learning, practice history and study plan.", icon: "↗", features: ["Continue a lesson", "Review recent practice", "Check your daily goal"] },
};
