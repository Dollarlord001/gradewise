import { z } from "zod";
import type {
  VideoImportBatchResult,
  VideoImportOutcome,
  VideoImportResultItem,
  VideoImportRow,
} from "@/types/video";

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

function extractYoutubeId(url?: string, explicit?: string): string | null {
  if (explicit && YOUTUBE_ID_RE.test(explicit)) return explicit;
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return YOUTUBE_ID_RE.test(id) ? id : null;
    }
    const v = u.searchParams.get("v");
    if (v && YOUTUBE_ID_RE.test(v)) return v;
  } catch {
    return null;
  }
  return null;
}

const rowSchema = z.object({
  externalId: z.string().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  subject: z.string().optional(),
  subjectId: z.string().uuid().optional().or(z.string().min(1).optional()),
  topic: z.string().optional(),
  topicId: z.string().optional(),
  subtopic: z.string().optional(),
  exam: z.string().optional(),
  examId: z.string().optional(),
  level: z.string().optional(),
  creator: z.string().optional(),
  tutor: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal("").optional()),
  youtubeUrl: z.string().optional(),
  youtubeVideoId: z.string().optional(),
  playlistId: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  durationSeconds: z.number().int().positive().optional(),
  licenseStatus: z.string().optional(),
  licenseType: z.string().optional(),
  licenseEvidenceRef: z.string().optional(),
  hostingMode: z.string().optional(),
  storageUrl: z.string().optional(),
  streamUrl: z.string().optional(),
  language: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
});

const ALLOWED_LICENCE = new Set([
  "owned",
  "licensed",
  "public_domain",
  "permission_granted",
]);

const ALLOWED_HOSTING = new Set([
  "tutor_me_cdn",
  "youtube_embed",
  "external_embed",
]);

/**
 * Validate a single manifest row. Never invents fields.
 * Does not call external APIs or scrape.
 */
export function validateVideoImportRow(
  row: VideoImportRow,
  rowIndex: number,
  existingFingerprints: Set<string>
): VideoImportResultItem {
  const reasons: string[] = [];
  const parsed = rowSchema.safeParse(row);
  if (!parsed.success) {
    return {
      rowIndex,
      externalId: row.externalId,
      title: row.title,
      outcome: "invalid",
      reasons: parsed.error.issues.map((i) => i.message),
    };
  }

  if (!row.title?.trim()) reasons.push("missing title");
  if (!row.subjectId && !row.subject?.trim()) reasons.push("missing subject");
  if (!row.topicId && !row.topic?.trim()) reasons.push("missing topic");

  const ytId = extractYoutubeId(row.youtubeUrl, row.youtubeVideoId);
  const hosting = row.hostingMode ?? (ytId ? "youtube_embed" : undefined);

  if (!hosting || !ALLOWED_HOSTING.has(hosting)) {
    reasons.push("unsupported or missing hosting mode");
  }

  if (hosting === "youtube_embed" && !ytId) {
    reasons.push("invalid or missing YouTube ID");
  }

  if (hosting === "tutor_me_cdn" && !row.storageUrl && !row.streamUrl) {
    reasons.push("CDN hosting requires storage_url or stream_url");
  }

  const licence = row.licenseStatus;
  if (!licence || !ALLOWED_LICENCE.has(licence)) {
    return {
      rowIndex,
      externalId: row.externalId,
      title: row.title,
      outcome: "missing_licence",
      reasons: ["missing or unsupported license_status — do not invent licences"],
    };
  }

  if (licence !== "owned" && licence !== "public_domain" && !row.licenseEvidenceRef?.trim()) {
    reasons.push("license evidence reference recommended for third-party content");
  }

  const fingerprint =
    row.externalId ||
    ytId ||
    row.storageUrl ||
    row.streamUrl ||
    `${row.title}|${row.subject}|${row.topic}`;

  if (fingerprint && existingFingerprints.has(fingerprint)) {
    return {
      rowIndex,
      externalId: row.externalId,
      title: row.title,
      outcome: "duplicate",
      reasons: ["duplicate video fingerprint"],
    };
  }

  if (reasons.length > 0) {
    return {
      rowIndex,
      externalId: row.externalId,
      title: row.title,
      outcome: "invalid",
      reasons,
    };
  }

  existingFingerprints.add(fingerprint);
  return {
    rowIndex,
    externalId: row.externalId,
    title: row.title,
    outcome: "imported",
    reasons: [],
  };
}

export function runVideoImportValidation(
  rows: VideoImportRow[],
  batchId: string,
  existingFingerprints: Set<string> = new Set()
): VideoImportBatchResult {
  const items: VideoImportResultItem[] = [];
  const counts: Record<VideoImportOutcome, number> = {
    imported: 0,
    skipped: 0,
    duplicate: 0,
    invalid: 0,
    missing_licence: 0,
    failed: 0,
  };

  rows.forEach((row, i) => {
    const result = validateVideoImportRow(row, i, existingFingerprints);
    items.push(result);
    counts[result.outcome]++;
  });

  return {
    batchId,
    seen: rows.length,
    imported: counts.imported,
    skipped: counts.skipped,
    duplicate: counts.duplicate,
    invalid: counts.invalid,
    missingLicence: counts.missing_licence,
    failed: counts.failed,
    items,
  };
}

/** Example JSONL manifest schema for operators */
export const MANIFEST_FORMAT_DOC = `
Each line is a JSON object (JSONL) or use a JSON array of objects.

Required for import to "imported":
- title
- subject OR subjectId
- topic OR topicId
- licenseStatus in: owned | licensed | public_domain | permission_granted
- hostingMode in: tutor_me_cdn | youtube_embed | external_embed
- For youtube_embed: valid youtubeVideoId or youtubeUrl
- For tutor_me_cdn: storageUrl or streamUrl

Never omit licence fields. Invalid rows are reported, not silently inserted.
`;
