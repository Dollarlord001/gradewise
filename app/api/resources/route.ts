import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 24;

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const page = Math.min(100000, Math.max(1, Number(params.get("page")) || 1));
    const exam = params.get("exam")?.toUpperCase(); const subject = params.get("subject")?.slice(0, 100);
    const topic = params.get("topic")?.slice(0, 150); const type = params.get("type")?.slice(0, 40);
    const search = params.get("q")?.slice(0, 100).replace(/[^\p{L}\p{N}\s'-]/gu, " ").trim();
    const supabase = await createClient();
    let allowedIds: string[] | null = null;
    if (subject) {
      const normalized = subject.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
      const { data: subjectRow, error: subjectError } = await supabase.from("subjects").select("id").eq("normalized_name", normalized).maybeSingle();
      if (subjectError) throw subjectError;
      const { data: links, error: linksError } = subjectRow ? await supabase.from("resource_subjects").select("resource_id").eq("subject_id", subjectRow.id) : { data: [], error: null };
      if (linksError) throw linksError;
      allowedIds = (links ?? []).map((row) => row.resource_id);
    }
    if (exam || topic) {
      let linksQuery = supabase.from("resource_topics").select("resource_id");
      if (exam) linksQuery = linksQuery.eq("exam", exam);
      if (topic) linksQuery = linksQuery.ilike("topic", `%${topic}%`);
      if (subject) linksQuery = linksQuery.ilike("subject", subject);
      const { data: topicLinks, error: topicError } = await linksQuery.limit(5000);
      if (topicError) throw topicError;
      const topicIds = new Set((topicLinks ?? []).map((row) => row.resource_id));
      allowedIds = allowedIds === null ? [...topicIds] : allowedIds.filter((id) => topicIds.has(id));
    }
    if (allowedIds && !allowedIds.length) return NextResponse.json({ items: [], total: 0, page, pageSize: PAGE_SIZE, hasMore: false });
    let query = supabase.from("learning_resources").select("id,title,author,publisher,exam_relevance,resource_type,publication_year,source,source_url,reader_url,rights_status,license,access_type,reader_available,download_allowed,cover_url,description,language,created_at,updated_at,provenance,rights_verified_at", { count: "exact" })
      .eq("reader_available", true).in("rights_status", ["OPEN_LICENSE", "PUBLIC_DOMAIN", "PERMISSION_GRANTED", "PUBLISHER_AUTHORIZED"]).order("title").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (allowedIds) query = query.in("id", allowedIds);
    if (type) query = query.eq("resource_type", type);
    if (search) query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,publisher.ilike.%${search}%,description.ilike.%${search}%`);
    const { data, error, count } = await query;
    if (error) throw error;
    const items = (data ?? []).map((item) => ({ id: item.id, title: item.title, author: item.author, publisher: item.publisher, examRelevance: item.exam_relevance, resourceType: item.resource_type, publicationYear: item.publication_year, source: item.source, sourceUrl: item.source_url, readerUrl: item.reader_url, rightsStatus: item.rights_status, license: item.license, accessType: item.access_type, readerAvailable: item.reader_available, downloadAllowed: item.download_allowed, coverUrl: item.cover_url, description: item.description, language: item.language, provenance: item.provenance, rightsVerifiedAt: item.rights_verified_at }));
    const total = count ?? 0;
    return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE, hasMore: page * PAGE_SIZE < total }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE, hasMore: false, error: "The resource catalogue is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
