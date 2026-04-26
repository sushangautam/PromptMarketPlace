import type { Metadata } from "next";
import Link from "next/link";
import { db, blogPosts } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SEO_CONFIG } from "@/config/seo";
import { buildBreadcrumbJsonLd } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Blog – AI Prompts Tips & Guides",
  description:
    "Learn how to write better AI prompts, make money selling prompts, and get the most out of ChatGPT, Midjourney, Claude & more.",
  alternates: { canonical: `${SEO_CONFIG.siteUrl}/blog` },
};

export const revalidate = 3600;

async function getPosts() {
  return db.query.blogPosts.findMany({
    where: eq(blogPosts.isPublished, true),
    orderBy: desc(blogPosts.publishedAt),
    limit: 50,
  });
}

export default async function BlogPage() {
  const posts = await getPosts();

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", url: SEO_CONFIG.siteUrl },
    { name: "Blog", url: `${SEO_CONFIG.siteUrl}/blog` },
  ]);

  const featured = posts[0];
  const rest     = posts.slice(1);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3">
            AI Prompts Blog
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl">
            Tips, guides and strategies for getting the most out of AI tools.
          </p>
        </div>

        {/* Featured post */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="group block mb-12">
            <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
              <div className="h-64 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950/40 dark:to-indigo-950/40 flex items-center justify-center">
                <span className="text-6xl">✍️</span>
              </div>
              <div className="p-8">
                {featured.tags?.[0] && (
                  <Badge className="mb-3">{featured.tags[0]}</Badge>
                )}
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white group-hover:text-violet-600 transition-colors mb-3">
                  {featured.title}
                </h2>
                {featured.metaDescription && (
                  <p className="text-zinc-500 line-clamp-2 mb-4">{featured.metaDescription}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  {featured.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(featured.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    5 min read
                  </span>
                  <span className="flex items-center gap-1 text-violet-600 font-medium">
                    Read more <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Post grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <article className="h-full rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 transition-colors overflow-hidden">
                  <div className="h-40 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 flex items-center justify-center">
                    <span className="text-4xl">📝</span>
                  </div>
                  <div className="p-5">
                    <h2 className="font-semibold text-zinc-900 dark:text-white group-hover:text-violet-600 transition-colors line-clamp-2 mb-2">
                      {post.title}
                    </h2>
                    {post.metaDescription && (
                      <p className="text-sm text-zinc-500 line-clamp-2 mb-4">{post.metaDescription}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      {post.publishedAt && (
                        <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      )}
                      <span>5 min</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 && (
          <div className="text-center py-20 text-zinc-400">
            <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300">Coming soon</p>
            <p className="text-sm mt-1">We&apos;re working on helpful guides for AI prompt creators.</p>
          </div>
        )}
      </div>
    </>
  );
}
