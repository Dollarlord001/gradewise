import type { MetadataRoute } from "next";

const paths = ["", "exams", "jamb", "waec", "neco", "bece", "learn", "practice", "cbt", "ai-tutor", "mistake-bank", "progress", "planner", "dashboard", "news", "admission", "scholarships", "signup", "signin"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: `https://tutor-me.ng/${path}`, lastModified: new Date("2026-10-01"), changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : path === "exams" ? 0.9 : 0.7 }));
}
