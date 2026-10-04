"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

function UpdatePasswordForm() {
  const params = useSearchParams(); const code = params.get("oobCode") ?? "";
  const [error, setError] = useState(""); const [done, setDone] = useState(false); const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const data = new FormData(event.currentTarget); const password = String(data.get("password")); const confirmation = String(data.get("confirmation"));
    if (password.length < 10 || password !== confirmation) { setError("Use at least 10 characters and make both entries match."); setPending(false); return; }
    try { await verifyPasswordResetCode(firebaseAuth(), code); await confirmPasswordReset(firebaseAuth(), code, password); setDone(true); }
    catch { setError("This reset link has expired. Request a new one."); }
    finally { setPending(false); }
  }
  return <main id="main-content" className="section auth-section"><section className="auth-card"><h1>Choose a new password</h1>{done ? <><p>Your password has been updated. Sign in with the new password.</p><Link className="button" href="/signin">Return to sign in</Link></> : <><p>Use at least 10 characters.</p><form onSubmit={submit}><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required/><label htmlFor="confirmation">Confirm password</label><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={10} maxLength={128} required/>{error && <p role="alert">{error}</p>}<button className="button" disabled={pending || !code}>{pending ? "Updating…" : "Update password"}</button></form><p><Link href="/signin">Return to sign in</Link></p></>}</section></main>;
}
export default function UpdatePasswordPage() { return <Suspense><UpdatePasswordForm/></Suspense>; }
