import type { Metadata } from "next";
import { CbtExperience } from "@/components/cbt-experience";

export const metadata: Metadata = { title: "CBT", robots: { index: false, follow: false } };

export default async function CbtPage({ searchParams }: { searchParams: Promise<{ practice?: string; subject?: string; topic?: string; count?: string }> }) {
  const params = await searchParams;
  const count = Number(params.count);
  const initialPractice = params.practice === "1" ? { subject: params.subject, topic: params.topic, count: Number.isInteger(count) && count >= 1 && count <= 40 ? count : 10 } : undefined;
  return <CbtExperience initialPractice={initialPractice} />;
}
