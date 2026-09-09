import type { MetadataRoute } from "next";
import { PAGES } from "@/lib/pages";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const landing = PAGES.map((page) => ({
    url: `${SITE_URL}${page.slug === "/" ? "" : page.slug}`,
    changeFrequency: "monthly" as const,
    priority: page.slug === "/" ? 1 : 0.8,
  }));
  const info = ["/about", "/privacy"].map((slug) => ({
    url: `${SITE_URL}${slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));
  return [...landing, ...info];
}
