import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/learn", "/practice", "/ai-tutor", "/mistake-bank", "/progress", "/planner", "/recover", "/auth/"] }, sitemap: `${siteUrl}/sitemap.xml` };
}
