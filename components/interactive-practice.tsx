import Link from "next/link";

export function InteractivePractice() {
  return <section className="practice-demo-card"><div className="practice-demo-head"><div><span className="eyebrow">TUTOR-ME question bank</span><h3>Start a verified practice session</h3></div></div><p>Choose a subject and any mapped topic. Your session starts when eligible, reviewed questions are available for your selection.</p><Link className="button" href="/cbt">Open CBT practice <span>→</span></Link></section>;
}

export function MobileBottomNav() {
  return <nav className="mobile-bottom-nav" aria-label="Quick navigation"><Link href="/dashboard"><span>◉</span>Home</Link><Link href="/learn"><span>↗</span>Learn</Link><Link href="/cbt"><span>⌁</span>Practice</Link><Link href="/progress"><span>◷</span>Progress</Link></nav>;
}
