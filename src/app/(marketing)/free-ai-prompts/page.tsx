import type { Metadata } from "next";
import Link from "next/link";
import { db, prompts } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { PromptCard } from "@/components/prompts/PromptCard";
import { Badge } from "@/components/ui/badge";
import { SEO_CONFIG, AI_TOOLS } from "@/config/seo";
import { buildBreadcrumbJsonLd } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Free AI Prompts – Download 1,000+ Free Prompts",
  description:
    "Download 1,000+ free AI prompts for ChatGPT, Midjourney, Claude, and more. No sign-up required for free prompts. Boost your productivity today.",
  alternates: { canonical: `${SEO_CONFIG.siteUrl}/free-ai-prompts` },
};

export const revalidate = 3600;

async function getFreePrompts() {
  return db.query.prompts.findMany({
    where: and(eq(prompts.status, "active"), eq(prompts.price, "0")),
    orderBy: desc(prompts.createdAt),
    limit: 48,
    with: { seller: true, category: true, aiTool: true },
    columns: { promptText: false },
  });
}

export default async function FreePromptsPage() {
  const freePrompts = await getFreePrompts();

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", url: SEO_CONFIG.siteUrl },
    { name: "Free AI Prompts", url: `${SEO_CONFIG.siteUrl}/free-ai-prompts` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/10 dark:to-zinc-950 pt-16 pb-8 border-b border-zinc-100 dark:border-zinc-800">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="free" className="mb-4 text-sm px-4 py-1.5">1,000+ Free Prompts</Badge>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3">
            Free AI Prompts
          </h1>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            High-quality prompts for ChatGPT, Midjourney, Claude & more — completely free.
          </p>

          {/* Tool filter strip */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <Link href="/free-ai-prompts">
              <Badge variant="secondary" className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700">All Tools</Badge>
            </Link>
            {AI_TOOLS.map((tool) => (
              <Link key={tool.slug} href={`/marketplace?tool=${tool.slug}&free=true`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 dark:hover:bg-violet-950/20 transition-colors">
                  {tool.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {freePrompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt as any} />
          ))}
        </div>

        {freePrompts.length === 0 && (
          <div className="text-center py-20 text-zinc-400">
            <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300 mb-1">Free prompts coming soon</p>
            <p className="text-sm">Check back shortly — our sellers are adding new free prompts daily.</p>
          </div>
        )}

        {/* SEO links */}
        <div className="mt-16 pt-10 border-t border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Free Prompts by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              "marketing", "coding", "writing", "design",
              "business", "social-media", "seo", "sales",
            ].map((cat) => (
              <Link
                key={cat}
                href={`/free-${cat}-prompts`}
                className="text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 capitalize underline-offset-4 hover:underline transition-colors"
              >
                Free {cat.replace("-", " ")} prompts
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
