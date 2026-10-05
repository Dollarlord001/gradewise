import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VideoWatchExperience } from "@/components/video/VideoWatchExperience";
import type { VideoRecord } from "@/types/video";

export default async function VideoWatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("video_catalogue").select("id,title,description,exam,subject,topic,subtopic,creator,source,source_url,video_url,video_id,licence,licence_status,licence_url,attribution,rights_evidence_url,duration_seconds,thumbnail_url,hosting_mode,published,status,created_at,updated_at,provenance").eq("id", id).eq("published", true).eq("status", "published").maybeSingle();
    if (error || !data) notFound();
    const video = {
      id: data.id, title: data.title, description: data.description, examId: data.exam, subjectId: data.subject, topicId: data.topic,
      subtopicId: data.subtopic, topicName: data.topic, subtopicName: data.subtopic, creator: data.creator, source: data.source,
      sourceUrl: data.source_url, youtubeUrl: data.hosting_mode === "youtube_embed" ? data.video_url : null,
      youtubeVideoId: data.hosting_mode === "youtube_embed" ? data.video_id : null,
      embedUrl: data.hosting_mode === "external_embed" ? data.video_url : null,
      streamUrl: data.hosting_mode === "tutor_me_cdn" ? data.video_url : null, durationSeconds: data.duration_seconds,
      thumbnailUrl: data.thumbnail_url, licenseStatus: data.licence_status, licenseType: data.licence,
      licenseEvidenceRef: data.rights_evidence_url, attribution: data.attribution, hostingMode: data.hosting_mode,
      published: data.published, status: data.status, createdAt: data.created_at, updatedAt: data.updated_at,
    } as VideoRecord & { attribution: string; licenseType: string; licenseEvidenceRef: string; topicName: string; subtopicName: string };
    return <VideoWatchExperience video={video} />;
  } catch {
    notFound();
  }
}
