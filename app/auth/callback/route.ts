import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next");
  const candidate = rawNext ? new URL(rawNext, url.origin) : new URL("/dashboard", url.origin);
  const next = candidate.origin === url.origin ? `${candidate.pathname}${candidate.search}${candidate.hash}` : "/dashboard";
  if (!code) return NextResponse.redirect(new URL("/signin?error=link", url.origin));
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  } catch { /* Return a generic link failure. */ }
  return NextResponse.redirect(new URL("/signin?error=link", url.origin));
}
