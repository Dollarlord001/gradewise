import type { Question } from "@/lib/content";

export const studentSubjects = [
  { name: "Chemistry", accuracy: 61, mastery: 58, topics: ["Organic Chemistry", "Acids and bases", "Chemical bonding"] },
  { name: "Biology", accuracy: 78, mastery: 72, topics: ["Cell structure", "Nutrition in plants", "Transport systems"] },
  { name: "Mathematics", accuracy: 84, mastery: 81, topics: ["Quadratic equations", "Surds", "Sequence and series"] },
  { name: "Use of English", accuracy: 73, mastery: 67, topics: ["Comprehension", "Lexis and structure", "Oral forms"] },
];

export const practiceQuestions: Question[] = [
  { id: "demo-chem-001", exam: "JAMB", year: null, subject: "Chemistry", paper: "Original practice", topic: "Organic Chemistry", subtopic: "Alkanes", difficulty: "medium", type: "multiple-choice", prompt: "Which of the following is the general formula for an open-chain alkane?", options: ["CₙH₂ₙ", "CₙH₂ₙ₊₂", "CₙH₂ₙ₋₂", "CₙHₙ"], answerIndex: 1, explanation: "Alkanes contain only single carbon–carbon bonds. For an open chain with n carbon atoms, the formula is CₙH₂ₙ₊₂.", objective: "Relate the molecular formula of an alkane to the number of carbon atoms.", provenance: { source: "TUTOR-ME original practice", rights: "original", verified: true } },
  { id: "demo-bio-002", exam: "JAMB", year: null, subject: "Biology", paper: "Original practice", topic: "Cell Biology", subtopic: "Cell organelles", difficulty: "easy", type: "multiple-choice", prompt: "Which cell structure is primarily responsible for releasing energy during aerobic respiration?", options: ["Ribosome", "Mitochondrion", "Golgi apparatus", "Cell wall"], answerIndex: 1, explanation: "Mitochondria are the main sites of aerobic respiration and ATP production in eukaryotic cells.", objective: "Identify the roles of major cell organelles.", provenance: { source: "TUTOR-ME original practice", rights: "original", verified: true } },
  { id: "demo-math-003", exam: "JAMB", year: null, subject: "Mathematics", paper: "Original practice", topic: "Algebra", subtopic: "Linear equations", difficulty: "easy", type: "multiple-choice", prompt: "If 3x − 5 = 16, what is the value of x?", options: ["5", "6", "7", "8"], answerIndex: 2, explanation: "Add 5 to both sides to get 3x = 21, then divide both sides by 3. Therefore, x = 7.", objective: "Solve a linear equation in one unknown.", provenance: { source: "TUTOR-ME original practice", rights: "original", verified: true } },
  { id: "demo-eng-004", exam: "JAMB", year: null, subject: "Use of English", paper: "Original practice", topic: "Lexis and structure", subtopic: "Vocabulary", difficulty: "medium", type: "multiple-choice", prompt: "Choose the word nearest in meaning to ‘diligent’. ", options: ["Careless", "Hard-working", "Impatient", "Uncertain"], answerIndex: 1, explanation: "A diligent person is careful and steady in their work; ‘hard-working’ is the closest option.", objective: "Use context and meaning to identify a synonym.", provenance: { source: "TUTOR-ME original practice", rights: "original", verified: true } },
  { id: "demo-chem-005", exam: "JAMB", year: null, subject: "Chemistry", paper: "Original practice", topic: "Organic Chemistry", subtopic: "Properties of alkanes", difficulty: "easy", type: "multiple-choice", prompt: "Which of these compounds is an alkane?", options: ["Ethene", "Ethane", "Ethyne", "Ethanol"], answerIndex: 1, explanation: "Ethane (C₂H₆) is an alkane: it is a saturated hydrocarbon with only single bonds between its carbon atoms.", objective: "Distinguish an alkane from other organic compounds.", provenance: { source: "TUTOR-ME original practice", rights: "original", verified: true } },
  { id: "demo-bio-006", exam: "JAMB", year: null, subject: "Biology", paper: "Original practice", topic: "Cell Biology", subtopic: "Cell organelles", difficulty: "medium", type: "multiple-choice", prompt: "Which organelle contains most of a eukaryotic cell’s genetic material?", options: ["Vacuole", "Nucleus", "Ribosome", "Cell membrane"], answerIndex: 1, explanation: "The nucleus contains most of the cell’s DNA and helps control cell activities.", objective: "Describe the functions of major cell organelles.", provenance: { source: "TUTOR-ME original practice", rights: "original", verified: true } },
  { id: "demo-math-007", exam: "JAMB", year: null, subject: "Mathematics", paper: "Original practice", topic: "Algebra", subtopic: "Factorisation", difficulty: "medium", type: "multiple-choice", prompt: "Which expression is equivalent to x² − 9?", options: ["(x − 3)²", "(x + 3)²", "(x − 3)(x + 3)", "x(x − 9)"], answerIndex: 2, explanation: "This is a difference of two squares: a² − b² = (a − b)(a + b). So x² − 9 = (x − 3)(x + 3).", objective: "Factorise a difference of two squares.", provenance: { source: "TUTOR-ME original practice", rights: "original", verified: true } },
  { id: "demo-math-009", exam: "JAMB", year: null, subject: "Mathematics", paper: "Original practice", topic: "Quadratic Equations", subtopic: "Roots and factorisation", difficulty: "medium", type: "multiple-choice", prompt: "What are the roots of x² − 5x + 6 = 0?", options: ["1 and 6", "2 and 3", "−2 and −3", "−1 and −6"], answerIndex: 1, explanation: "Factor the expression as (x − 2)(x − 3) = 0. Setting each factor to zero gives x = 2 or x = 3.", objective: "Solve a quadratic equation by factorisation.", provenance: { source: "TUTOR-ME original practice", rights: "original", verified: true } },
  { id: "demo-eng-008", exam: "JAMB", year: null, subject: "Use of English", paper: "Original practice", topic: "Lexis and structure", subtopic: "Vocabulary", difficulty: "easy", type: "multiple-choice", prompt: "Choose the word opposite in meaning to ‘scarce’. ", options: ["Rare", "Limited", "Plentiful", "Insufficient"], answerIndex: 2, explanation: "Scarce means limited or in short supply. Plentiful is its opposite.", objective: "Use word meaning and context to identify an antonym.", provenance: { source: "TUTOR-ME original practice", rights: "original", verified: true } },
];

export type MistakeRecord = { questionId: string; selected: number; date: string; attempt: number; questionSnapshot?: Question };

export type StudentDemoState = {
  learnerName: string;
  exam: string;
  target: number;
  subjects: string[];
  weakTopics: string[];
  mistakes: MistakeRecord[];
  completedLessons: string[];
  activitiesDone: string[];
  targetExamDate: string;
  weeklyStudyHours: number;
  questionCount: number;
  correctCount: number;
};

export const initialStudentState: StudentDemoState = {
  learnerName: "Adaeze", exam: "JAMB", target: 320, subjects: ["Use of English", "Mathematics", "Chemistry", "Biology"], weakTopics: ["Organic Chemistry", "Quadratic Equations"],
  mistakes: [{ questionId: "demo-chem-001", selected: 0, date: "Today · 9:42 am", attempt: 2 }], completedLessons: ["Cell structure and organisation"], activitiesDone: [], targetExamDate: "", weeklyStudyHours: 7, questionCount: 148, correctCount: 105,
};

export const demoTopics = [
  { subject: "Chemistry", topic: "Organic Chemistry", subtopic: "Alkanes and homologous series", mastery: 42, duration: "12 min", kind: "Lesson" },
  { subject: "Biology", topic: "Cell structure and organisation", subtopic: "Organelles and their functions", mastery: 100, duration: "8 min", kind: "Completed" },
  { subject: "Mathematics", topic: "Quadratic Equations", subtopic: "Factorisation and roots", mastery: 55, duration: "15 min", kind: "Lesson" },
  { subject: "Use of English", topic: "Comprehension", subtopic: "Main ideas and inference", mastery: 72, duration: "10 min", kind: "Study note" },
  { subject: "Biology", topic: "Nutrition in plants", subtopic: "Photosynthesis", mastery: 60, duration: "11 min", kind: "Lesson" },
  { subject: "Chemistry", topic: "Acids and bases", subtopic: "pH and indicators", mastery: 68, duration: "9 min", kind: "Flashcards" },
];
