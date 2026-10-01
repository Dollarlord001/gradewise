"use client";

import { useState, type FormEvent } from "react";

export function AuthDemoForm({ signup }: { signup: boolean }) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return <><form onSubmit={handleSubmit}>
    {signup && <><label htmlFor="first-name">First name</label><input id="first-name" name="firstName" placeholder="Your first name" autoComplete="given-name" required/> </>}
    <label htmlFor="email">Email address</label><input id="email" type="email" placeholder="you@example.com" autoComplete="email" required/>
    <label htmlFor="password">Password</label><input id="password" type="password" placeholder="At least 8 characters" minLength={8} autoComplete={signup ? "new-password" : "current-password"} required/>
    <button type="submit" className="button auth-submit">{signup ? "Create profile" : "Sign in"} <span>↗</span></button>
  </form><small className="demo-notice" role="status">{submitted ? "Thanks — this demo doesn’t send or save your details. Account access will be available when sign-in is connected." : "Demo form only. Your details are not sent or saved; account access needs a connected authentication service."}</small></>;
}
