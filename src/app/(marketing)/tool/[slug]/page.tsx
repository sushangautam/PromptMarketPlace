import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db, prompts, aiTools } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { PromptCard } from "@/components/prompts/PromptCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO_CONFIG, AI_TOOLS, USE_CASES } from "@/config/seo";
import { buildBreadcrumbJsonLd } from "@/lib/seo/metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return AI_TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = AI_TOOLS.find((t) => t.slug === slug);
  if (!tool) return {};
  return {
    title: `Best ${tool.name} Prompts – Professional Prompt Templates`,
    description: `Discover the best ${tool.name} prompts for marketing, coding, writing, design and more. Buy expert-crafted ${tool.name} prompt templates or get them free.`,
    alternates: { canonical: `${SEO_CONFIG.siteUrl}/tool/${slug}` },
  };
}

export const revalidate = 3600;

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = AI_TOOLS.find((t) => t.slug === slug);
  if (!tool) notFound();

  const dbTool = await db.query.aiTools.findFirst({ where: eq(aiTools.slug, slug) });

  const toolPrompts = dbTool
    ? await db.query.prompts.findMany({
        where: and(eq(prompts.status, "active"), eq(prompts.aiToolId, dbTool.id)),
        orderBy: desc(prompts.purchaseCount),
        limit: 24,
        with: { seller: true, category: true, aiTool: true },
        columns: { promptText: false },
      })
    : [];

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", url: SEO_CONFIG.siteUrl },
    { name: "Tools", url: `${SEO_CONFIG.siteUrl}/marketplace` },
    { name: `${tool.name} Prompts`, url: `${SEO_CONFIG.siteUrl}/tool/${slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* Hero */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Badge className="mb-4">{tool.company}</Badge>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3">
            Best {tool.name} Prompts
          </h1>
          <p className="text-zinc-500 text-lg">
            Expert-crafted {tool.name} prompt templates for marketing, coding, writing, design and more.
            Instantly usable, professionally tested.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Browse by use case */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Browse by use case
          </h2>
          <div className="flex flex-wrap gap-2">
            {USE_CASES.slice(0, 12).map((uc) => (
              <Link key={uc} href={`/best-${slug}-prompts-for-${uc}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 dark:hover:bg-violet-950/20 capitalize transition-colors">
                  {uc.replace(/-/g, " ")}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Prompt grid */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {toolPrompts.length > 0 ? `${toolPrompts.length}+ ${tool.name} Prompts` : `Top ${tool.name} Prompts`}
          </h2>
          <Link href={`/marketplace?tool=${slug}`}>
            <Button variant="outline" size="sm">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {toolPrompts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {toolPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-zinc-400 border border-zinc-100 dark:border-zinc-800 rounded-xl">
            <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300 mb-1">
              {tool.name} prompts coming soon
            </p>
            <p className="text-sm mb-4">Be the first to sell {tool.name} prompts on PromptMarket.</p>
            <Link href="/sell">
              <Button variant="gradient" size="sm">Start Selling</Button>
            </Link>
          </div>
        )}

        {/* Internal linking */}
        <div className="mt-16 pt-10 border-t border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Popular {tool.name} prompt collections
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {USE_CASES.slice(0, 8).map((uc) => (
              <Link
                key={uc}
                href={`/best-${slug}-prompts-for-${uc}`}
                className="text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 capitalize underline-offset-4 hover:underline transition-colors"
              >
                {tool.name} prompts for {uc.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
