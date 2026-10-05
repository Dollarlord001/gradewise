export interface ExamDefinition {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description?: string;
  subjects?: string[];
}

export const EXAMS: ExamDefinition[] = [
  {
    id: "jamb",
    slug: "jamb",
    name: "JAMB",
    shortName: "JAMB",
    description: "Prepare for the Joint Admissions and Matriculation Board examination.",
  },
  {
    id: "waec",
    slug: "waec",
    name: "WAEC",
    shortName: "WAEC",
    description: "Prepare for West African Examinations Council examinations.",
  },
  {
    id: "neco",
    slug: "neco",
    name: "NECO",
    shortName: "NECO",
    description: "Prepare for National Examinations Council examinations.",
  },
  {
    id: "bece",
    slug: "bece",
    name: "BECE",
    shortName: "BECE",
    description: "Prepare for Basic Education Certificate Examination.",
  },
];

export function getExam(id: string) {
  return EXAMS.find((exam) => exam.id === id);
}
