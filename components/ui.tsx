import Link from "next/link";

export function SectionHeading({ eyebrow, title, copy, align = "left" }: { eyebrow?: string; title: string; copy?: string; align?: "left" | "center" }) {
  return <div className={`section-heading align-${align}`}>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{copy && <p>{copy}</p>}</div>;
}

export function ProgressBar({ value, label, color = "blue" }: { value: number; label?: string; color?: "blue" | "green" | "gold" }) {
  return <div className="progress-wrap">{label && <div className="progress-label"><span>{label}</span><strong>{value}%</strong></div>}<div className="progress-track" role="progressbar" aria-label={label ?? "Progress"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span className={`progress-fill fill-${color}`} style={{ width: `${value}%` }} /></div></div>;
}

export function ExamCard({ exam }: { exam: { slug: string; name: string; fullName: string; description: string; subjects: string[]; color: string } }) {
  return <Link className={`exam-card exam-${exam.color}`} href={`/${exam.slug}`}><span className="exam-card-top"><span className="exam-card-mark">{exam.name.slice(0, 1)}</span><span className="arrow-circle" aria-hidden="true">↗</span></span><span className="exam-card-name">{exam.name}</span><span className="exam-card-subtitle">{exam.fullName}</span><span className="exam-card-subjects">{exam.subjects.slice(0, 3).join(" · ")}</span><span className="exam-card-link">Explore preparation <span aria-hidden="true">→</span></span></Link>;
}

export function DestinationCard({ title, copy, href, icon, tag }: { title: string; copy: string; href: string; icon: string; tag?: string }) {
  return <Link className="destination-card" href={href}><span className="destination-icon">{icon}</span>{tag && <span className="destination-tag">{tag}</span>}<h3>{title}</h3><p>{copy}</p><span className="destination-arrow" aria-hidden="true">↗</span></Link>;
}

export function CTA({ title = "Your next exam is a journey. Take the next step today.", copy = "Start with one subject, one topic and a study plan that fits your day.", button = "Start preparing", href = "/signup" }: { title?: string; copy?: string; button?: string; href?: string }) {
  return <section className="cta-band"><div className="cta-orbit orbit-one" /><div className="cta-orbit orbit-two" /><div className="cta-content"><span className="eyebrow eyebrow-light">Make today count</span><h2>{title}</h2><p>{copy}</p><Link className="button button-white" href={href}>{button} <span aria-hidden="true">↗</span></Link></div><div className="cta-note"><span className="cta-note-check">✓</span><span><strong>One focused session</strong><small>is a good place to begin.</small></span></div></section>;
}
