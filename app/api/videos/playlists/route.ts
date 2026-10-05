import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("video_playlists").select("id,title,description,exam,subject,topic,video_playlist_items(video_id,sort_order)").eq("status", "published").order("title").limit(200);
    if (error) throw error;
    const playlists = (data ?? []).map((playlist) => ({ id: playlist.id, title: playlist.title, description: playlist.description, exam: playlist.exam, subject: playlist.subject, topic: playlist.topic, videoIds: [...(playlist.video_playlist_items ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((item) => item.video_id) }));
    return NextResponse.json({ playlists }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ playlists: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
