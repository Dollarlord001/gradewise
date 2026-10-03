import type { Question } from "@/lib/content";

// Empty production state: account progress is populated only by persisted CBT activity.
export const studentSubjects: Array<{ name: string; accuracy: number; mastery: number; topics: string[] }> = [];
export const practiceQuestions: Question[] = [];
export type MistakeRecord = { questionId: string; selected: number; date: string; attempt: number; questionSnapshot?: Question };
export type StudentDemoState = {
  learnerName: string; exam: string; target: number; subjects: string[]; weakTopics: string[];
  mistakes: MistakeRecord[]; completedLessons: string[]; activitiesDone: string[]; targetExamDate: string;
  weeklyStudyHours: number; questionCount: number; correctCount: number;
};
export const initialStudentState: StudentDemoState = {
  learnerName: "", exam: "JAMB", target: 0, subjects: [], weakTopics: [], mistakes: [], completedLessons: [],
  activitiesDone: [], targetExamDate: "", weeklyStudyHours: 0, questionCount: 0, correctCount: 0,
};
export const demoTopics: Array<{ subject: string; topic: string; subtopic: string; mastery: number; duration: string; kind: string }> = [];
