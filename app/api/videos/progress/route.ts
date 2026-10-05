import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppIdentity } from "@/lib/firebase/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const schema = z.object({ videoId: z.string().uuid(), positionSeconds: z.number().int().min(0).max(86_400), percent: z.number().min(0).max(100), completed: z.boolean().default(false) });

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  if (origin === new URL(request.url).origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? new URL(request.url).protocol.replace(":", "");
  return !!host && origin === `${protocol}://${host}`;
}

export async function GET(request: Request) {
  const videoId = new URL(request.url).searchParams.get("videoId");
  if (!z.string().uuid().safeParse(videoId).success) return NextResponse.json({ error: "Invalid video." }, { status: 400 });
  const identity = await getAppIdentity();
  if (!identity) return NextResponse.json({ progress: null });
  const supabase = await createClient(identity.idToken);
  const { data, error } = await supabase.from("video_watch_progress").select("last_position_seconds,watch_percent,completed,completed_at").eq("student_id", identity.studentId).eq("video_id", videoId).maybeSingle();
  if (error) return NextResponse.json({ error: "Video progress could not be loaded." }, { status: 503 });
  return NextResponse.json({ progress: data ? { positionSeconds: data.last_position_seconds, percent: data.watch_percent, completed: data.completed, completedAt: data.completed_at } : null }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const identity = await getAppIdentity();
  if (!identity) return NextResponse.json({ error: "Sign in to sync video progress." }, { status: 401 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid video progress." }, { status: 400 });
  const supabase = await createClient(identity.idToken);
  const now = new Date().toISOString();
  const { error } = await supabase.from("video_watch_progress").upsert({
    student_id: identity.studentId, video_id: body.data.videoId, last_position_seconds: body.data.positionSeconds,
    watch_percent: Math.round(body.data.percent * 100) / 100, completed: body.data.completed,
    completed_at: body.data.completed ? now : null, updated_at: now,
  }, { onConflict: "student_id,video_id" });
  if (error) return NextResponse.json({ error: "Video progress could not be saved." }, { status: 503 });
  return NextResponse.json({ saved: true }, { headers: { "Cache-Control": "private, no-store" } });
}
