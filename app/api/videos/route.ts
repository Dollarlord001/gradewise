import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 24;

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const page = Math.min(100000, Math.max(1, Number(params.get("page")) || 1));
    const exam = params.get("exam")?.toUpperCase(); const subject = params.get("subject");
    const topic = params.get("topic"); const q = params.get("q")?.slice(0, 100).replace(/[^\p{L}\p{N}\s'-]/gu, " ").trim();
    const supabase = await createClient();
    const playlistId = params.get("playlistId");
    let playlistVideoIds: string[] | null = null;
    if (playlistId) {
      const { data: playlist, error: playlistError } = await supabase.from("video_playlists").select("video_playlist_items(video_id,sort_order)").eq("id", playlistId).eq("status", "published").maybeSingle();
      if (playlistError) throw playlistError;
      playlistVideoIds = (playlist?.video_playlist_items ?? []).sort((a, b) => a.sort_order - b.sort_order).map((item) => item.video_id);
      if (!playlistVideoIds.length) return NextResponse.json({ items: [], total: 0, page, pageSize: PAGE_SIZE, hasMore: false });
    }
    let query = supabase.from("video_catalogue").select("id,title,description,subject,exam,topic,subtopic,creator,source,source_url,video_url,video_id,licence,licence_status,licence_url,attribution,rights_evidence_url,duration_seconds,thumbnail_url,hosting_mode,status,published,provenance,created_at,updated_at", { count: "exact" }).eq("status", "published").eq("published", true).order("title").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (exam) query = query.eq("exam", exam);
    if (subject) query = query.ilike("subject", subject);
    if (topic) query = query.ilike("topic", `%${topic}%`);
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,creator.ilike.%${q}%,topic.ilike.%${q}%,subtopic.ilike.%${q}%`);
    if (playlistVideoIds) query = query.in("id", playlistVideoIds);
    const { data, error, count } = await query;
    if (error) throw error;
    const items = (data ?? []).map((row) => ({ id: row.id, title: row.title, description: row.description, subjectId: row.subject, examId: row.exam, topicId: row.topic, subtopicId: row.subtopic, creator: row.creator, source: row.source, sourceUrl: row.source_url, youtubeUrl: row.hosting_mode === "youtube_embed" ? row.video_url : null, youtubeVideoId: row.hosting_mode === "youtube_embed" ? row.video_id : null, embedUrl: row.hosting_mode === "external_embed" ? row.video_url : null, streamUrl: ["tutor_me_cdn", "external_video"].includes(row.hosting_mode) ? row.video_url : null, durationSeconds: row.duration_seconds, thumbnailUrl: row.thumbnail_url, licenseStatus: row.licence_status, licenseType: row.licence, licenseEvidenceRef: row.rights_evidence_url, hostingMode: row.hosting_mode, published: row.published, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, attribution: row.attribution, provenance: row.provenance }));
    const total = count ?? 0;
    return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE, hasMore: page * PAGE_SIZE < total }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE, hasMore: false, error: "The approved video catalogue is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
