import { getSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const configured = Boolean(getSupabaseConfig());
  let database = false;
  if (configured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("topics").select("id").limit(1);
      database = !error;
    } catch { database = false; }
  }
  const ready = configured && database;
  return Response.json({ status: ready ? "ready" : "not_ready", dependencies: { supabaseAuthConfigured: configured, database } }, {
    status: ready ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
