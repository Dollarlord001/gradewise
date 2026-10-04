import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawNext = url.searchParams.get("next");
  let next = "/dashboard";
  if (rawNext?.startsWith("/") && !rawNext.startsWith("//")) {
    try {
      const candidate = new URL(rawNext, url.origin);
      if (candidate.origin === url.origin) next = `${candidate.pathname}${candidate.search}${candidate.hash}`;
    } catch { /* Keep the safe dashboard fallback. */ }
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
