/** Learning hierarchy — data-driven for all 28+ subjects. */

export type ContentStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "published"
  | "rejected"
  | "expired"
  | "unpublished";

export type LicenseStatus =
  | "unknown"
  | "owned"
  | "licensed"
  | "public_domain"
  | "permission_granted"
  | "pending"
  | "expired"
  | "rejected";

export type HostingMode = "tutor_me_cdn" | "youtube_embed" | "external_embed" | "external_video" | "unavailable";

export type ResourceType =
  | "textbook"
  | "pdf"
  | "study_guide"
  | "syllabus"
  | "reference"
  | "oer"
  | "official"
  | "other";

export type AccessType = "read_online" | "download" | "both" | "link_out";

export interface SubjectRef {
  id: string;
  name: string;
  slug: string;
  normalizedName: string;
}

export interface TopicNode {
  id: string;
  subjectId: string;
  subjectSlug: string;
  name: string;
  slug: string;
  parentId: string | null;
  description?: string | null;
  objectives?: string[];
  sortOrder?: number;
  isOfficial?: boolean;
  examIds?: string[];
}

export interface Lesson {
  id: string;
  topicId: string;
  subjectId: string;
  title: string;
  slug: string;
  summary?: string | null;
  bodyMarkdown?: string | null;
  estimatedMinutes?: number | null;
  sortOrder?: number;
  status: ContentStatus;
  objectives?: string[];
}

export interface LearningNote {
  id: string;
  title: string;
  bodyMarkdown: string;
  subjectId: string;
  topicId?: string | null;
  subtopicId?: string | null;
  examId?: string | null;
  lessonId?: string | null;
  status: ContentStatus;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  subjectId?: string | null;
  topicId?: string | null;
  sortOrder?: number;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subjectId: string;
  topicId?: string | null;
  examId?: string | null;
  cardCount: number;
  status: ContentStatus;
}

export interface LearningResource {
  id: string;
  title: string;
  author?: string | null;
  publisher?: string | null;
  description?: string | null;
  subjectIds: string[];
  examIds?: string[];
  topicIds?: string[];
  level?: string | null;
  resourceType: ResourceType;
  rightsStatus: LicenseStatus;
  license?: string | null;
  accessType: AccessType;
  readerUrl?: string | null;
  downloadUrl?: string | null;
  coverUrl?: string | null;
  publicationYear?: number | null;
  language?: string | null;
  source: string;
  sourceUrl?: string | null;
  status: ContentStatus;
}

/** Student progress — only real events */
export type LearningEventKind =
  | "lesson_started"
  | "lesson_completed"
  | "video_started"
  | "video_progress"
  | "video_completed"
  | "notes_viewed"
  | "flashcards_reviewed"
  | "practice_completed"
  | "resource_opened";

export interface LearningProgressEvent {
  id: string;
  studentId: string;
  kind: LearningEventKind;
  subjectId?: string | null;
  topicId?: string | null;
  lessonId?: string | null;
  videoId?: string | null;
  resourceId?: string | null;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface TopicLearningPageModel {
  topic: TopicNode;
  subject: SubjectRef;
  parentTopic?: TopicNode | null;
  children: TopicNode[];
  lessons: Lesson[];
  notes: LearningNote[];
  videos: { id: string; title: string; durationSeconds?: number | null; thumbnailUrl?: string | null }[];
  flashcardDecks: FlashcardDeck[];
  resources: LearningResource[];
  relatedPracticeHref: string;
  nextAction?: { label: string; href: string; reason: string } | null;
}
