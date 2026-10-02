import "server-only";

type LimitResult = { success: boolean; retryAfterSeconds: number };
const script = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]); end; return n";

/** Shared fixed-window limiter for server mutations. Production requires Upstash Redis. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<LimitResult> {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (baseUrl && token) {
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/eval/${encodeURIComponent(script)}/${encodeURIComponent(`tutor-me:${key}`)}/${windowMs}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!response.ok) throw new Error("Rate-limit service unavailable");
      const data = await response.json() as { result: number };
      return { success: data.result <= limit, retryAfterSeconds: Math.ceil(windowMs / 1000) };
    } catch {
      if (process.env.NODE_ENV === "production") return { success: false, retryAfterSeconds: 60 };
    }
  } else if (process.env.NODE_ENV === "production") {
    return { success: false, retryAfterSeconds: 60 };
  }

  // Development-only fallback. This is intentionally not represented as horizontally shared.
  const store = globalThis as typeof globalThis & { __tutorRate?: Map<string, { count: number; until: number }> };
  store.__tutorRate ??= new Map();
  const now = Date.now();
  const entry = store.__tutorRate.get(key);
  const next = !entry || entry.until <= now ? { count: 1, until: now + windowMs } : { ...entry, count: entry.count + 1 };
  store.__tutorRate.set(key, next);
  return { success: next.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((next.until - now) / 1000)) };
}

export function requestIdentity(headers: Headers) {
  // x-forwarded-for can be supplied by a caller. Use the platform edge's peer address.
  return headers.get("x-real-ip")?.trim() || "unknown";
}
