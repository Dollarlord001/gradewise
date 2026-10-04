import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { firebaseAdminAuth } from "@/lib/firebase/admin";
import { FIREBASE_SESSION_COOKIE } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const { idToken } = await request.json();
    if (typeof idToken !== "string" || idToken.length > 8192) return NextResponse.json({ error: "Invalid sign-in token." }, { status: 400 });
    const decoded = await firebaseAdminAuth().verifyIdToken(idToken, true);
    if (decoded.aud !== "tutor-me-2fb22") return NextResponse.json({ error: "Invalid account project." }, { status: 401 });
    if (decoded.role !== "authenticated") {
      const auth = firebaseAdminAuth();
      const user = await auth.getUser(decoded.uid);
      await auth.setCustomUserClaims(decoded.uid, { ...user.customClaims, role: "authenticated" });
      return NextResponse.json({ refreshToken: true }, { headers: { "Cache-Control": "no-store" } });
    }
    const jar = await cookies();
    jar.set(FIREBASE_SESSION_COOKIE, idToken, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60,
    });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Sign-in could not be verified." }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  (await cookies()).delete(FIREBASE_SESSION_COOKIE);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
