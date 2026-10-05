"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword, GoogleAuthProvider, RecaptchaVerifier, sendEmailVerification,
  sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPhoneNumber, signInWithPopup, updateProfile, type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { syncFirebaseSession } from "@/lib/firebase/client-session";

async function establishSession() {
  const user = firebaseAuth().currentUser;
  if (!user) throw new Error("Sign-in could not be verified.");
  await syncFirebaseSession(user);
}

export function AuthDemoForm({ signup, next }: { signup: boolean; next?: string }) {
  const router = useRouter();
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [pending, setPending] = useState(false);
  const [phoneMode, setPhoneMode] = useState(false); const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const destination = next && ["/dashboard", "/learn", "/practice", "/ai-tutor", "/mistake-bank", "/progress", "/planner", "/cbt"].includes(next.split(/[?#]/, 1)[0]) ? next : "/dashboard";
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setPending(true);
    const values = new FormData(event.currentTarget); const email = String(values.get("email") ?? ""); const password = String(values.get("password") ?? "");
    try {
      const auth = firebaseAuth();
      if (phoneMode) {
        if (confirmation) await confirmation.confirm(String(values.get("otp") ?? ""));
        else {
          const verifier = new RecaptchaVerifier(auth, "phone-recaptcha", { size: "invisible" });
          setConfirmation(await signInWithPhoneNumber(auth, String(values.get("phone") ?? ""), verifier)); setMessage("Enter the code sent to your phone."); setPending(false); return;
        }
      } else if (signup) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: String(values.get("firstName") ?? "").trim() });
        await sendEmailVerification(credential.user);
        setMessage("Check your email to verify your address. Your study plan is ready to set up.");
      } else await signInWithEmailAndPassword(auth, email, password);
      await establishSession();
      router.push(signup ? "/signup?onboarding=1" : destination); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "We couldn't complete that request. Check your details and try again."); }
    finally { setPending(false); }
  }
  async function google() {
    setError(""); setPending(true);
    try { await signInWithPopup(firebaseAuth(), new GoogleAuthProvider()); await establishSession(); router.push(signup ? "/signup?onboarding=1" : destination); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Google sign-in failed. Try again."); }
    finally { setPending(false); }
  }
  async function reset() {
    const email = (document.getElementById("email") as HTMLInputElement | null)?.value;
    if (!email) { setError("Enter your email address first."); return; }
    setPending(true); setError("");
    try { await sendPasswordResetEmail(firebaseAuth(), email, { url: `${location.origin}/auth/update-password`, handleCodeInApp: true }); setMessage("If an account matches that address, a password reset link will arrive shortly."); }
    catch { setMessage("If an account matches that address, a password reset link will arrive shortly."); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit}>
    {phoneMode ? <><label htmlFor="phone">Phone number (include country code)</label><input id="phone" name="phone" type="tel" placeholder="+234…" required={!confirmation}/>{confirmation && <><label htmlFor="otp">Verification code</label><input id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" required/></>}<div id="phone-recaptcha"/></> : <>
      {signup && <><label htmlFor="first-name">Name</label><input id="first-name" name="firstName" placeholder="Your name" autoComplete="name" minLength={2} maxLength={80} required/> </>}
      <label htmlFor="email">Email address</label><input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength={254} required/>
      <label htmlFor="password">Password</label><input id="password" name="password" type="password" placeholder="At least 10 characters" minLength={10} maxLength={128} autoComplete={signup ? "new-password" : "current-password"} required/>
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <button type="submit" className="button auth-submit" disabled={pending}>{pending ? "Please wait…" : confirmation ? "Verify phone" : phoneMode ? "Send code" : signup ? "Create account" : "Sign in"} <span>↗</span></button>
    <button type="button" className="button button-outline" disabled={pending} onClick={google}>Continue with Google</button>
    {!signup && <><button type="button" className="button button-outline" onClick={() => { setPhoneMode(!phoneMode); setConfirmation(null); }}>Use phone verification</button><p><button type="button" onClick={reset} disabled={pending}>Forgot your password?</button> · <Link href="/recover">More recovery options</Link></p></>}
  </form>;
}

export function RecoveryForm() {
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setError(""); setMessage(""); const email = new FormData(event.currentTarget).get("email"); try { await sendPasswordResetEmail(firebaseAuth(), String(email), { url: `${location.origin}/auth/update-password`, handleCodeInApp: true }); } catch { /* Avoid account enumeration. */ } setMessage("If an account matches that address, a password reset link will arrive shortly."); setPending(false); }
  return <form onSubmit={submit}><label htmlFor="recovery-email">Email address</label><input id="recovery-email" name="email" type="email" autoComplete="email" maxLength={254} required/>{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}<button className="button" disabled={pending}>{pending ? "Please wait…" : "Send reset link"}</button></form>;
}
