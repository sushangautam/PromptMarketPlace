import type { MetadataRoute } from "next";
import { db, prompts, categories, aiTools, seoPages, blogPosts } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { SEO_CONFIG, AI_TOOLS, USE_CASES, JOB_TITLES } from "@/config/seo";

export const revalidate = 86400; // Regenerate sitemap daily

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SEO_CONFIG.siteUrl;
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/sell`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/free-ai-prompts`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  // Tool pages
  const toolPages: MetadataRoute.Sitemap = AI_TOOLS.map((tool) => ({
    url: `${base}/tool/${tool.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  // Programmatic SEO pages
  const programmaticPages: MetadataRoute.Sitemap = [];
  for (const tool of AI_TOOLS) {
    for (const useCase of USE_CASES) {
      programmaticPages.push({
        url: `${base}/best-${tool.slug}-prompts-for-${useCase}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      });
    }
  }
  for (const useCase of USE_CASES) {
    programmaticPages.push({
      url: `${base}/free-${useCase}-prompts`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    });
  }
  for (const job of JOB_TITLES) {
    programmaticPages.push({
      url: `${base}/prompts-for-${job}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.70,
    });
  }

  // Dynamic prompt pages
  const allPrompts = await db.query.prompts.findMany({
    where: eq(prompts.status, "active"),
    columns: { slug: true, updatedAt: true },
  });
  const promptPages: MetadataRoute.Sitemap = allPrompts.map((p) => ({
    url: `${base}/prompts/${p.slug}`,
    lastModified: p.updatedAt || now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Category pages
  const allCategories = await db.query.categories.findMany({
    columns: { slug: true },
  });
  const categoryPages: MetadataRoute.Sitemap = allCategories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Blog posts
  const publishedPosts = await db.query.blogPosts.findMany({
    where: eq(blogPosts.isPublished, true),
    columns: { slug: true, updatedAt: true },
  });
  const blogPages: MetadataRoute.Sitemap = publishedPosts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.updatedAt || now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...toolPages,
    ...categoryPages,
    ...programmaticPages,
    ...promptPages,
    ...blogPages,
  ];
}
