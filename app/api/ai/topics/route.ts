import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const querySchema = z.object({ exam: z.enum(["JAMB", "WAEC", "NECO"]), subject: z.string().min(1).max(100) });

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Choose an exam and subject." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("topics").select("id,name,parent_id,exam,subject,is_official,sort_order").eq("exam", parsed.data.exam).eq("subject", parsed.data.subject).order("sort_order").order("name").limit(300);
    if (error) throw error;
    return NextResponse.json({ topics: (data ?? []).map((topic) => ({ id: topic.id, name: topic.name, parentId: topic.parent_id, official: topic.is_official })) }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ topics: [], catalogueAvailable: false, error: "The official topic catalogue is temporarily unavailable. Enter a topic name to continue." }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
