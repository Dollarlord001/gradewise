/**
 * Catalogue access layer — interface for host app to implement with Supabase/SQL.
 * Pagination and filters keep UI manageable at 20k+ videos.
 */

import type { VideoListFilters, VideoListResult, VideoRecord, VideoWatchProgress } from "@/types/video";

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;

export function normalizeListFilters(input: VideoListFilters): Required<
  Pick<VideoListFilters, "page" | "pageSize" | "sort" | "publishedOnly">
> &
  VideoListFilters {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE));
  return {
    ...input,
    page,
    pageSize,
    sort: input.sort ?? "sort_order",
    publishedOnly: input.publishedOnly ?? true,
  };
}

export function emptyVideoList(page = 1, pageSize = DEFAULT_PAGE_SIZE): VideoListResult {
  return { items: [], total: 0, page, pageSize, hasMore: false };
}

/** Host app implements these against the real database */
export interface VideoCatalogueRepository {
  list(filters: VideoListFilters): Promise<VideoListResult>;
  getById(id: string): Promise<VideoRecord | null>;
  getProgress(studentId: string, videoId: string): Promise<VideoWatchProgress | null>;
  upsertProgress(progress: VideoWatchProgress): Promise<void>;
  recommend(ctx: {
    studentId?: string;
    subjectId?: string;
    topicId?: string;
    limit?: number;
  }): Promise<VideoRecord[]>;
}

/**
 * Contextual recommendations without claiming deep AI when data is thin.
 */
export function rankSimpleRecommendations(
  candidates: VideoRecord[],
  ctx: { subjectId?: string; topicId?: string; limit?: number }
): VideoRecord[] {
  const limit = ctx.limit ?? 8;
  const scored = candidates.map((v) => {
    let score = 0;
    if (ctx.topicId && v.topicId === ctx.topicId) score += 10;
    if (ctx.subjectId && v.subjectId === ctx.subjectId) score += 5;
    if (v.published && v.status === "published") score += 2;
    return { v, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.v);
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
