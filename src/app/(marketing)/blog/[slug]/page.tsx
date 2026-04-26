import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db, blogPosts } from "@/lib/db";
import { eq, and, ne } from "drizzle-orm";
import { Calendar, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SEO_CONFIG } from "@/config/seo";
import { buildBreadcrumbJsonLd } from "@/lib/seo/metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)),
  });
  if (!post) return {};
  return {
    title: post.title,
    description: post.metaDescription || undefined,
    alternates: { canonical: `${SEO_CONFIG.siteUrl}/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.metaDescription || undefined,
      url: `${SEO_CONFIG.siteUrl}/blog/${slug}`,
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

export const revalidate = 86400;

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)),
  });
  if (!post) notFound();

  const related = await db.query.blogPosts.findMany({
    where: and(eq(blogPosts.isPublished, true), ne(blogPosts.slug, slug)),
    limit: 3,
  });

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", url: SEO_CONFIG.siteUrl },
    { name: "Blog", url: `${SEO_CONFIG.siteUrl}/blog` },
    { name: post.title, url: `${SEO_CONFIG.siteUrl}/blog/${slug}` },
  ]);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedAt?.toISOString(),
    publisher: { "@type": "Organization", name: SEO_CONFIG.siteName, url: SEO_CONFIG.siteUrl },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-10">
          {post.tags?.[0] && (
            <Badge className="mb-4">{post.tags[0]}</Badge>
          )}
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white leading-tight mb-4">
            {post.title}
          </h1>
          {post.metaDescription && (
            <p className="text-xl text-zinc-500 leading-relaxed mb-6">{post.metaDescription}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-zinc-400 border-y border-zinc-100 dark:border-zinc-800 py-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : "Draft"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              5 min read
            </span>
          </div>
        </header>

        {/* Content */}
        <div
          className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:rounded prose-code:px-1"
          dangerouslySetInnerHTML={{ __html: post.content || "<p>Content coming soon.</p>" }}
        />

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">More Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                  <h3 className="font-medium text-zinc-900 dark:text-white group-hover:text-violet-600 text-sm line-clamp-2 mb-1 transition-colors">
                    {r.title}
                  </h3>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    Read more <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
