"use client";

import type { User } from "firebase/auth";

export async function syncFirebaseSession(user: User) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const idToken = await user.getIdToken(attempt > 0);
    const response = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }), credentials: "same-origin" });
    if (!response.ok) throw new Error("Secure session could not be created.");
    const result = await response.json() as { refreshToken?: boolean };
    if (!result.refreshToken) return;
  }
  throw new Error("Secure session could not be created. Sign in again.");
}
