"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { rateLimit, requestIdentity } from "@/lib/security/rate-limit";

export type AuthState = { error?: string; message?: string } | undefined;
const emailField = z.string().trim().email().max(254);
const passwordField = z.string().min(10).max(128);
const safeMessage = "We couldn't complete that request. Check your details and try again.";

async function allowed(action: string, email: string) {
  const identity = requestIdentity(await headers());
  const result = await rateLimit(`${action}:${identity}:${email.toLowerCase()}`, 8, 60_000);
  return result.success;
}

export async function signInAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailField.safeParse(formData.get("email"));
  const password = passwordField.safeParse(formData.get("password"));
  if (!email.success || !password.success) return { error: "Enter a valid email and password (at least 10 characters)." };
  if (!getSupabaseConfig()) return { error: "Account access is not configured yet. Please try again later." };
  if (!await allowed("signin", email.data)) return { error: "Too many attempts. Wait a little and try again." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
    if (error) return { error: safeMessage };
  } catch {
    return { error: safeMessage };
  }
  redirect("/dashboard");
}

export async function signUpAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const name = z.string().trim().min(2).max(80).safeParse(formData.get("firstName"));
  const email = emailField.safeParse(formData.get("email"));
  const password = passwordField.safeParse(formData.get("password"));
  if (!name.success || !email.success || !password.success) return { error: "Enter your name, a valid email and a password with at least 10 characters." };
  if (!getSupabaseConfig()) return { error: "Account creation is not configured yet. Please try again later." };
  if (!await allowed("signup", email.data)) return { error: "Too many attempts. Wait a little and try again." };
  try {
    const supabase = await createClient();
    const callbackUrl = new URL("/auth/callback", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
    callbackUrl.searchParams.set("next", "/signup?onboarding=1");
    const { data, error } = await supabase.auth.signUp({
      email: email.data, password: password.data,
      options: { data: { display_name: name.data }, emailRedirectTo: callbackUrl.toString() },
    });
    if (error || !data.user) return { error: safeMessage };
    if (!data.session) return { message: "Check your email for a verification link. Once verified, sign in to finish your study profile." };
  } catch {
    return { error: safeMessage };
  }
  redirect("/signup?onboarding=1");
}

export async function signOutAction() {
  if (getSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/signin");
}

export async function requestPasswordResetAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailField.safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  if (!getSupabaseConfig()) return { error: "Password recovery is not configured yet." };
  if (!await allowed("recovery", email.data)) return { error: "Too many attempts. Wait a little and try again." };
  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/update-password` });
  } catch {
    // Same response prevents account enumeration.
  }
  return { message: "If an account matches that address, a password reset link will arrive shortly." };
}

export async function updatePasswordAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const password = passwordField.safeParse(formData.get("password"));
  const confirmation = z.string().safeParse(formData.get("confirmation"));
  if (!password.success || !confirmation.success || password.data !== confirmation.data) return { error: "Use a password of at least 10 characters and make both entries match." };
  if (!getSupabaseConfig()) return { error: "Password reset is not configured yet." };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "This reset link has expired. Request a new one." };
    const { error } = await supabase.auth.updateUser({ password: password.data });
    if (error) return { error: safeMessage };
    await supabase.auth.signOut();
  } catch {
    return { error: safeMessage };
  }
  redirect("/signin?passwordReset=1");
}

export async function saveStudentOnboardingAction(formData: FormData): Promise<AuthState> {
  const displayName = z.string().trim().min(2).max(80).safeParse(formData.get("displayName"));
  const exam = z.enum(["JAMB", "WAEC", "NECO", "BECE"]).safeParse(formData.get("exam"));
  const target = z.coerce.number().int().min(0).max(1000).safeParse(formData.get("target"));
  const minutes = z.coerce.number().int().min(0).max(1440).safeParse(formData.get("minutes"));
  const subjects = z.array(z.string().trim().min(1).max(80)).min(1).max(8).safeParse(formData.getAll("subject"));
  if (!displayName.success || !exam.success || !target.success || !minutes.success || !subjects.success) return { error: "Check your name, exam, target and subject selections." };
  if (!getSupabaseConfig()) return { error: "Account access is not configured yet. Please try again later." };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Your session has expired. Sign in to save your study plan." };
    const { error } = await supabase.rpc("save_student_onboarding", {
      p_display_name: displayName.data,
      p_exam: exam.data,
      p_target_score: target.data,
      p_study_minutes: minutes.data,
      p_subjects: [...new Set(subjects.data)],
      p_preferences: { studyRhythmMinutes: minutes.data },
    });
    if (error) return { error: "We couldn't save your study plan. Please try again." };
  } catch {
    return { error: "We couldn't save your study plan. Please try again." };
  }
  redirect("/dashboard");
}
