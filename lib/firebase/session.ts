import "server-only";
import { cookies } from "next/headers";
import { firebaseAdminAuth } from "./admin";

export const FIREBASE_SESSION_COOKIE = "tutorme_session";
export type AppIdentity = { uid: string; email: string | null; emailVerified: boolean; name: string | null; studentId: string; idToken: string };

export async function getAppIdentity(): Promise<AppIdentity | null> {
  const token = (await cookies()).get(FIREBASE_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const decoded = await firebaseAdminAuth().verifyIdToken(token, true);
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient(token);
    const { data: studentId, error } = await supabase.rpc("resolve_firebase_student");
    if (error || typeof studentId !== "string") return null;
    return { uid: decoded.uid, email: decoded.email ?? null, emailVerified: decoded.email_verified === true, name: decoded.name ?? null, studentId, idToken: token };
  } catch { return null; }
}
