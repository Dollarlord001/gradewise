import Link from "next/link";
import { RecoveryForm } from "@/components/auth-demo-form";

export const metadata = { title: "Recover your account | TUTOR-ME", robots: { index: false, follow: false } };
export default function RecoverPage() { return <main id="main-content" className="section auth-section"><section className="auth-card"><h1>Reset your password</h1><p>Enter your account email and we’ll send a secure reset link if it matches an account.</p><RecoveryForm/><p className="auth-switch"><Link href="/signin">Back to sign in</Link></p></section></main>; }
