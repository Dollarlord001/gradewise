/**
 * Scalable video catalogue — no artificial ceiling.
 * Designed for 1.4k → 20k+ rows via indexes, filters, pagination.
 */

import type { ContentStatus, HostingMode, LicenseStatus } from "./learning";

export interface VideoRecord {
  id: string;
  title: string;
  description?: string | null;
  subjectId: string;
  topicId?: string | null;
  subtopicId?: string | null;
  examId?: string | null;
  level?: string | null;
  creator?: string | null;
  tutor?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  youtubeUrl?: string | null;
  youtubeVideoId?: string | null;
  playlistId?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  licenseStatus: LicenseStatus;
  licenseType?: string | null;
  /** Opaque licence evidence reference — not displayed as fake endorsement */
  licenseEvidenceRef?: string | null;
  hostingMode: HostingMode;
  storageUrl?: string | null;
  streamUrl?: string | null;
  embedUrl?: string | null;
  sortOrder?: number;
  published: boolean;
  status: ContentStatus;
  language?: string | null;
  captionsAvailable?: boolean;
  transcriptAvailable?: boolean;
  difficulty?: number | null;
  tags?: string[];
  contentFingerprint?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VideoPlaylist {
  id: string;
  title: string;
  description?: string | null;
  subjectId?: string | null;
  topicId?: string | null;
  examId?: string | null;
  videoIds: string[];
  status: ContentStatus;
}

export interface VideoWatchProgress {
  studentId: string;
  videoId: string;
  startedAt: string;
  lastPositionSeconds: number;
  watchPercent: number;
  completed: boolean;
  completedAt?: string | null;
  updatedAt: string;
}

export interface VideoListFilters {
  examId?: string;
  subjectId?: string;
  topicId?: string;
  subtopicId?: string;
  level?: string;
  creator?: string;
  tutor?: string;
  playlistId?: string;
  q?: string;
  status?: ContentStatus;
  publishedOnly?: boolean;
  page?: number;
  pageSize?: number;
  sort?: "newest" | "oldest" | "title" | "duration" | "sort_order";
}

export interface VideoListResult {
  items: VideoRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Manifest row for bulk import — validated before insert */
export interface VideoImportRow {
  externalId?: string;
  title?: string;
  description?: string;
  subject?: string;
  subjectId?: string;
  topic?: string;
  topicId?: string;
  subtopic?: string;
  exam?: string;
  examId?: string;
  level?: string;
  creator?: string;
  tutor?: string;
  source?: string;
  sourceUrl?: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  playlistId?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  licenseStatus?: string;
  licenseType?: string;
  licenseEvidenceRef?: string;
  hostingMode?: string;
  storageUrl?: string;
  streamUrl?: string;
  language?: string;
  tags?: string[];
  sortOrder?: number;
}

export type VideoImportOutcome =
  | "imported"
  | "skipped"
  | "duplicate"
  | "invalid"
  | "missing_licence"
  | "failed";

export interface VideoImportResultItem {
  rowIndex: number;
  externalId?: string;
  title?: string;
  outcome: VideoImportOutcome;
  reasons: string[];
  videoId?: string;
}

export interface VideoImportBatchResult {
  batchId: string;
  seen: number;
  imported: number;
  skipped: number;
  duplicate: number;
  invalid: number;
  missingLicence: number;
  failed: number;
  items: VideoImportResultItem[];
}
