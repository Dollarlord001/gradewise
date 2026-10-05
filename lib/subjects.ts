/** 28 core subjects — architecture supports more via DB later. */

export const SUBJECT_CATALOGUE = [
  { name: "English", slug: "english" },
  { name: "Mathematics", slug: "mathematics" },
  { name: "Biology", slug: "biology" },
  { name: "Chemistry", slug: "chemistry" },
  { name: "Physics", slug: "physics" },
  { name: "Agriculture", slug: "agriculture" },
  { name: "Economics", slug: "economics" },
  { name: "Government", slug: "government" },
  { name: "Geography", slug: "geography" },
  { name: "Literature", slug: "literature" },
  { name: "Commerce", slug: "commerce" },
  { name: "Christian Religious Knowledge", slug: "christian-religious-knowledge" },
  { name: "Accounting", slug: "accounting" },
  { name: "Further Mathematics", slug: "further-mathematics" },
  { name: "Computer", slug: "computer" },
  { name: "Civic Education", slug: "civic-education" },
  { name: "Animal Husbandry", slug: "animal-husbandry" },
  { name: "Islamic Religious Knowledge", slug: "islamic-religious-knowledge" },
  { name: "Arabic", slug: "arabic" },
  { name: "History", slug: "history" },
  { name: "Home Economics", slug: "home-economics" },
  { name: "Insurance", slug: "insurance" },
  { name: "Current Affairs", slug: "current-affairs" },
  { name: "Fine Art", slug: "fine-art" },
  { name: "Music", slug: "music" },
  { name: "Hausa", slug: "hausa" },
  { name: "Igbo", slug: "igbo" },
  { name: "Yoruba", slug: "yoruba" },
] as const;

export type SubjectSlug = (typeof SUBJECT_CATALOGUE)[number]["slug"];

export function getSubjectBySlug(slug: string) {
  return SUBJECT_CATALOGUE.find((s) => s.slug === slug) ?? null;
}

export function normalizeSubjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
