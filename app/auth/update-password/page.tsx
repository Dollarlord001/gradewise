"use client";
import { useActionState } from "react";
import Link from "next/link";
import { updatePasswordAction, type AuthState } from "@/app/actions/auth";

export default function UpdatePasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePasswordAction, undefined);
  return <main id="main-content" className="section auth-section"><section className="auth-card"><h1>Choose a new password</h1><p>Use at least 10 characters.</p><form action={action}><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required/><label htmlFor="confirmation">Confirm password</label><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={10} maxLength={128} required/>{state?.error && <p role="alert">{state.error}</p>}<button className="button" disabled={pending}>Update password</button></form><p><Link href="/signin">Return to sign in</Link></p></section></main>;
}
