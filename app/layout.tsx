import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "./workspace.css";
import "./resources.css";
import "./landing.css";
import "./quality.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  title: { default: "TUTOR-ME | Smarter exam preparation for Nigerian students", template: "%s | TUTOR-ME" },
  description: "Prepare for JAMB, WAEC, NECO and BECE with clear lessons, purposeful practice, CBT training and a study plan built around your goals.",
  openGraph: { title: "TUTOR-ME | Prepare with purpose", description: "Clear lessons, purposeful practice and steady progress for Nigerian students.", siteName: "TUTOR-ME", locale: "en_NG", type: "website", url: "/" },
  twitter: { card: "summary_large_image", title: "TUTOR-ME | Prepare with purpose", description: "Clear lessons and purposeful practice for your next exam." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col"><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader />{children}<SiteFooter /></body>
    </html>
  );
}
