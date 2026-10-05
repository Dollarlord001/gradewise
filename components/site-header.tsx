"use client";

import Link from "next/link";
import { useState } from "react";
import { navLinks } from "@/lib/content";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return <Link className={`brand${inverse ? " brand-inverse" : ""}`} href="/" aria-label="TUTOR-ME home"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="M5 10.5c5.6-.9 10.6.4 15 4v18c-4.4-3.6-9.4-4.9-15-4V10.5Z" fill="currentColor" opacity=".95"/><path d="M35 10.5c-5.6-.9-10.6.4-15 4v18c4.4-3.6 9.4-4.9 15-4V10.5Z" fill="currentColor" opacity=".62"/><path d="M20 15v17.3M9 16.2c2.8-.1 5.2.6 7.5 2M31 16.2c-2.8-.1-5.2.6-7.5 2" stroke="white" strokeWidth="1.6" strokeLinecap="round"/><path d="M20 5.2v5.2M17.4 7.8h5.2" stroke="#18A66A" strokeWidth="2" strokeLinecap="round"/></svg></span><span className="brand-name">TUTOR<span className="brand-dash">-</span>ME</span></Link>;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <><div className="announcement"><span className="announcement-dot" /> A clearer way to prepare for your next exam <Link href="/exams">Find your exam <span aria-hidden="true">↗</span></Link></div><header className="site-header"><div className="header-inner"><Logo /><nav className={`main-nav${open ? " nav-open" : ""}`} aria-label="Main navigation">{navLinks.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}</nav><div className="header-actions"><ThemeToggle /><Link className="signin-link" href="/signin">Sign in</Link><Link className="button button-small" href="/signup">Create free account <span aria-hidden="true">↗</span></Link></div><button className="menu-toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /></button></div></header></>;
}
