import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db, prompts, categories, aiTools } from "@/lib/db";
import { eq, and, ilike } from "drizzle-orm";
import { PromptCard } from "@/components/prompts/PromptCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildProgrammaticMetadata, buildBreadcrumbJsonLd } from "@/lib/seo/metadata";
import { SEO_CONFIG, AI_TOOLS, USE_CASES, JOB_TITLES } from "@/config/seo";
import { ArrowRight } from "lucide-react";

interface PageProps {
  params: { seo: string[] };
}

type PageConfig = {
  type: "best-tool-prompts" | "free-category" | "prompts-for-job";
  tool?: string;
  useCase?: string;
  job?: string;
  category?: string;
};

function parseSlug(segments: string[]): PageConfig | null {
  const slug = segments.join("/");

  // /best-{tool}-prompts-for-{usecase}
  const bestToolMatch = slug.match(/^best-([a-z0-9-]+)-prompts-for-([a-z0-9-]+)$/);
  if (bestToolMatch) {
    const tool    = AI_TOOLS.find((t) => t.slug === bestToolMatch[1]);
    const useCase = USE_CASES.find((u) => u === bestToolMatch[2]);
    if (tool && useCase) return { type: "best-tool-prompts", tool: tool.slug, useCase };
  }

  // /free-{category}-prompts
  const freeMatch = slug.match(/^free-([a-z0-9-]+)-prompts$/);
  if (freeMatch) {
    const cat = USE_CASES.find((u) => u === freeMatch[1]);
    if (cat) return { type: "free-category", category: cat };
  }

  // /prompts-for-{job}
  const jobMatch = slug.match(/^prompts-for-([a-z0-9-]+)$/);
  if (jobMatch) {
    const job = JOB_TITLES.find((j) => j === jobMatch[1]);
    if (job) return { type: "prompts-for-job", job };
  }

  return null;
}

function formatLabel(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { seo } = await params;
  const config = parseSlug(seo);
  if (!config) return { title: "Not Found" };

  const toolName = config.tool ? AI_TOOLS.find((t) => t.slug === config.tool)?.name || config.tool : "";
  const subject  = config.useCase || config.category || config.job || "";

  return buildProgrammaticMetadata({ tool: toolName, useCase: subject, count: 50 });
}

export async function generateStaticParams() {
  const params: { seo: string[] }[] = [];

  // best-{tool}-prompts-for-{usecase}
  for (const tool of AI_TOOLS) {
    for (const useCase of USE_CASES) {
      params.push({ seo: [`best-${tool.slug}-prompts-for-${useCase}`] });
    }
  }
  // free-{category}-prompts
  for (const useCase of USE_CASES) {
    params.push({ seo: [`free-${useCase}-prompts`] });
  }
  // prompts-for-{job}
  for (const job of JOB_TITLES) {
    params.push({ seo: [`prompts-for-${job}`] });
  }

  return params;
}

export const revalidate = 3600;

async function getPrompts(config: PageConfig) {
  const conditions = [eq(prompts.status, "active")];

  if (config.type === "free-category" || config.type === "best-tool-prompts") {
    if (config.type === "free-category") {
      conditions.push(eq(prompts.price, "0"));
    }
    if (config.tool) {
      const tool = await db.query.aiTools.findFirst({ where: eq(aiTools.slug, config.tool) });
      if (tool) conditions.push(eq(prompts.aiToolId, tool.id));
    }
    if (config.useCase || config.category) {
      const slug = config.useCase || config.category!;
      const cat = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
      if (cat) conditions.push(eq(prompts.categoryId, cat.id));
    }
  }

  return db.query.prompts.findMany({
    where: and(...conditions),
    limit: 24,
    with: { seller: true, category: true, aiTool: true },
    columns: { promptText: false },
  });
}

// Static FAQ generator — unique per page, not generic
function generateFaqs(config: PageConfig): Array<{ q: string; a: string }> {
  const toolName  = config.tool ? AI_TOOLS.find((t) => t.slug === config.tool)?.name || config.tool : "AI";
  const subject   = formatLabel(config.useCase || config.category || config.job || "professionals");

  return [
    {
      q: `What are the best ${toolName} prompts for ${subject.toLowerCase()}?`,
      a: `The best ${toolName} prompts for ${subject.toLowerCase()} are specific, detailed, and include context about your goal, audience, and format. On PromptMarket you'll find expert-crafted prompts verified to deliver consistent results.`,
    },
    {
      q: `Are there free ${toolName} prompts for ${subject.toLowerCase()}?`,
      a: `Yes! We have a growing library of free ${toolName} prompts for ${subject.toLowerCase()}. Filter by "Free" in the marketplace or visit our free prompts section.`,
    },
    {
      q: `How do I use these prompts with ${toolName}?`,
      a: `Simply copy the prompt from PromptMarket, paste it into ${toolName}, and customize the bracketed variables (like [your topic] or [target audience]) with your specific details.`,
    },
    {
      q: `Can I sell my own ${toolName} prompts for ${subject.toLowerCase()}?`,
      a: `Absolutely. Sign up as a seller, upload your prompt with a description and example output, set your price, and start earning. We handle payments and take only 20% commission.`,
    },
  ];
}

export default async function ProgrammaticSeoPage({ params }: PageProps) {
  const { seo } = await params;
  const config = parseSlug(seo);
  if (!config) notFound();

  const results    = await getPrompts(config);
  const faqs       = generateFaqs(config);
  const toolObj    = config.tool ? AI_TOOLS.find((t) => t.slug === config.tool) : null;
  const toolName   = toolObj?.name || "AI";
  const subjectRaw = config.useCase || config.category || config.job || "professionals";
  const subject    = formatLabel(subjectRaw);

  let h1: string;
  let description: string;
  if (config.type === "best-tool-prompts") {
    h1 = `Best ${toolName} Prompts for ${subject}`;
    description = `Discover ${results.length}+ expert ${toolName} prompts for ${subject.toLowerCase()}. Copy, customize, and get results instantly.`;
  } else if (config.type === "free-category") {
    h1 = `Free ${subject} AI Prompts`;
    description = `${results.length}+ free ${subject.toLowerCase()} AI prompts for ChatGPT, Claude, Midjourney & more. No credit card required.`;
  } else {
    h1 = `AI Prompts for ${subject}`;
    description = `Professional AI prompts built specifically for ${subject.toLowerCase()}. Save hours of work with battle-tested prompts.`;
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-violet-50 to-white dark:from-zinc-900 dark:to-zinc-950 py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {toolObj && <Badge>{toolObj.name}</Badge>}
            <Badge variant="secondary">{subject}</Badge>
            {config.type === "free-category" && <Badge variant="free">Free</Badge>}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">{h1}</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">{description}</p>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-zinc-500">{results.length} prompts found</p>
          <Link href="/marketplace">
            <Button variant="outline" size="sm">Browse All <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((p) => <PromptCard key={p.id} prompt={p as any} />)}
        </div>
        {results.length === 0 && (
          <div className="text-center py-16 text-zinc-400">
            <p className="text-lg mb-4">No prompts yet for this category.</p>
            <Link href="/sell"><Button>Be the first to sell here</Button></Link>
          </div>
        )}
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="group rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-zinc-900 dark:text-white list-none">
                {faq.q}
              </summary>
              <p className="mt-3 text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Internal links */}
      <section className="container mx-auto px-4 pb-16 max-w-3xl">
        <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Related Collections</h3>
        <div className="flex flex-wrap gap-2">
          {AI_TOOLS.slice(0, 5).map((t) => (
            <Link key={t.slug} href={`/best-${t.slug}-prompts-for-${subjectRaw}`}>
              <Badge variant="outline" className="cursor-pointer hover:border-violet-300 text-sm">
                Best {t.name} prompts for {formatLabel(subjectRaw).toLowerCase()}
              </Badge>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
