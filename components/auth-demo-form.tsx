"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction, signInAction, signUpAction, type AuthState } from "@/app/actions/auth";

export function AuthDemoForm({ signup }: { signup: boolean }) {
  const action = signup ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);
  return <form action={formAction}>
    {signup && <><label htmlFor="first-name">Name</label><input id="first-name" name="firstName" placeholder="Your name" autoComplete="name" minLength={2} maxLength={80} required /></>}
    <label htmlFor="email">Email address</label><input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength={254} required />
    <label htmlFor="password">Password</label><input id="password" name="password" type="password" placeholder="At least 10 characters" minLength={10} maxLength={128} autoComplete={signup ? "new-password" : "current-password"} required />
    {state?.error && <p className="form-error" role="alert">{state.error}</p>}{state?.message && <p role="status">{state.message}</p>}
    <button type="submit" className="button auth-submit" disabled={pending}>{pending ? "Please wait…" : signup ? "Create account" : "Sign in"} <span>↗</span></button>
    {!signup && <p><Link href="/recover">Forgot your password?</Link></p>}
  </form>;
}

export function RecoveryForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(requestPasswordResetAction, undefined);
  return <form action={formAction}><label htmlFor="recovery-email">Email address</label><input id="recovery-email" name="email" type="email" autoComplete="email" maxLength={254} required />{state?.error && <p role="alert">{state.error}</p>}{state?.message && <p role="status">{state.message}</p>}<button className="button" disabled={pending}>Send reset link</button></form>;
}
