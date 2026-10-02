import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const paths = ["", "exams", "jamb", "waec", "neco", "bece", "cbt", "news", "admission", "scholarships"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: path ? `${siteUrl}/${path}` : siteUrl, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : path === "exams" ? 0.9 : 0.7 }));
}
