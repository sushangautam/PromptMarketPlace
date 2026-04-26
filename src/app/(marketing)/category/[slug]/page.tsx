import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db, prompts, categories } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { PromptCard } from "@/components/prompts/PromptCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO_CONFIG, AI_TOOLS } from "@/config/seo";
import { buildBreadcrumbJsonLd } from "@/lib/seo/metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const CATEGORY_SLUGS = [
  "marketing", "coding", "design", "writing", "business",
  "education", "photography", "social-media", "video", "other",
];

const CATEGORY_META: Record<string, { name: string; icon: string; desc: string }> = {
  "marketing":    { name: "Marketing",    icon: "📣", desc: "AI prompts for ads, copy, campaigns, and marketing strategy." },
  "coding":       { name: "Coding",       icon: "💻", desc: "Code review, debugging, documentation, and development prompts." },
  "design":       { name: "Design",       icon: "🎨", desc: "UI/UX, branding, logo, and visual design AI prompts." },
  "writing":      { name: "Writing",      icon: "✍️", desc: "Blog posts, storytelling, copywriting, and creative writing prompts." },
  "business":     { name: "Business",     icon: "💼", desc: "Strategy, analysis, planning, and business development prompts." },
  "education":    { name: "Education",    icon: "📚", desc: "Teaching, studying, lesson planning, and tutoring prompts." },
  "photography":  { name: "Photography",  icon: "📸", desc: "Photo editing, composition, and photography style prompts." },
  "social-media": { name: "Social Media", icon: "📱", desc: "Instagram, LinkedIn, TikTok, and social content prompts." },
  "video":        { name: "Video",        icon: "🎬", desc: "YouTube scripts, video concepts, and video production prompts." },
  "other":        { name: "Other",        icon: "⚡", desc: "Prompts that don't fit neatly into one category." },
};

export async function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = CATEGORY_META[slug];
  if (!meta) return {};
  return {
    title: `Best ${meta.name} AI Prompts – ${meta.name} Prompt Templates`,
    description: meta.desc,
    alternates: { canonical: `${SEO_CONFIG.siteUrl}/category/${slug}` },
  };
}

export const revalidate = 3600;

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const meta = CATEGORY_META[slug];
  if (!meta) notFound();

  const category = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });

  const catPrompts = category
    ? await db.query.prompts.findMany({
        where: and(eq(prompts.status, "active"), eq(prompts.categoryId, category.id)),
        orderBy: desc(prompts.purchaseCount),
        limit: 24,
        with: { seller: true, category: true, aiTool: true },
        columns: { promptText: false },
      })
    : [];

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", url: SEO_CONFIG.siteUrl },
    { name: "Marketplace", url: `${SEO_CONFIG.siteUrl}/marketplace` },
    { name: `${meta.name} Prompts`, url: `${SEO_CONFIG.siteUrl}/category/${slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <span className="text-5xl mb-4 block">{meta.icon}</span>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3">
            {meta.name} AI Prompts
          </h1>
          <p className="text-zinc-500 text-lg">{meta.desc}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Tool filter */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Filter by AI Tool</h2>
          <div className="flex flex-wrap gap-2">
            <Link href={`/marketplace?category=${slug}`}>
              <Badge variant="secondary" className="cursor-pointer">All Tools</Badge>
            </Link>
            {AI_TOOLS.map((tool) => (
              <Link key={tool.slug} href={`/marketplace?category=${slug}&tool=${tool.slug}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 dark:hover:bg-violet-950/20 transition-colors">
                  {tool.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {catPrompts.length > 0 ? `${catPrompts.length}+ ${meta.name} Prompts` : `Top ${meta.name} Prompts`}
          </h2>
          <Link href={`/marketplace?category=${slug}`}>
            <Button variant="outline" size="sm">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {catPrompts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {catPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-zinc-400 border border-zinc-100 dark:border-zinc-800 rounded-xl">
            <span className="text-4xl mb-4 block">{meta.icon}</span>
            <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300 mb-1">
              {meta.name} prompts coming soon
            </p>
            <p className="text-sm mb-4">Be the first to sell {meta.name.toLowerCase()} prompts.</p>
            <Link href="/sell">
              <Button variant="gradient" size="sm">Start Selling</Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
