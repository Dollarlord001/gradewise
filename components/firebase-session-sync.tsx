"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { syncFirebaseSession } from "@/lib/firebase/client-session";

export function FirebaseSessionSync() {
  useEffect(() => {
    let active = true; let lastUid: string | null = null; let lastToken = ""; let pending = false;
    const unsubscribe = onIdTokenChanged(firebaseAuth(), async (user) => {
      if (!active || pending) return;
      if (!user) {
        if (lastUid) await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" }).catch(() => undefined);
        lastUid = null; lastToken = ""; return;
      }
      pending = true;
      try {
        const token = await user.getIdToken();
        if (active && (lastUid !== user.uid || token !== lastToken)) { await syncFirebaseSession(user); lastUid = user.uid; lastToken = token; }
      } catch { /* Protected server operations reject an expired cookie until a successful refresh. */ }
      finally { pending = false; }
    });
    return () => { active = false; unsubscribe(); };
  }, []);
  return null;
}
