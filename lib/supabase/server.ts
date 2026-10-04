import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseConfig } from "./env";

export async function createClient(firebaseIdToken?: string) {
  const { url, key } = requireSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    global: firebaseIdToken ? { headers: { Authorization: `Bearer ${firebaseIdToken}` } } : undefined,
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. proxy.ts refreshes sessions on requests.
        }
      },
    },
  });
}
