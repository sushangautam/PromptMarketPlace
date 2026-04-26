import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db, prompts, users, userLibrary } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { Avatar } from "@/components/ui/avatar";
import { PromptCard } from "@/components/prompts/PromptCard";
import { PurchaseButton } from "@/components/payments/PurchaseButton";
import { buildPromptMetadata, buildPromptJsonLd, buildFaqJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/metadata";
import { SEO_CONFIG } from "@/config/seo";
import { ShieldCheck, Zap, Eye, Copy, ChevronDown } from "lucide-react";
import type { Prompt } from "@/types";

interface PageProps {
  params: { slug: string };
}

async function getPrompt(slug: string) {
  return db.query.prompts.findFirst({
    where: and(eq(prompts.slug, slug), eq(prompts.status, "active")),
    with: {
      seller: { columns: { id: true, username: true, fullName: true, avatarUrl: true, isVerified: true, bio: true } },
      category: true,
      aiTool: true,
    },
  });
}

async function getRelatedPrompts(prompt: { categoryId: string | null; aiToolId: string | null; id: string }) {
  if (!prompt.categoryId) return [];
  return db.query.prompts.findMany({
    where: and(eq(prompts.categoryId, prompt.categoryId!), eq(prompts.status, "active")),
    limit: 4,
    with: { seller: true, category: true, aiTool: true },
    columns: { promptText: false },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const prompt = await getPrompt(params.slug);
  if (!prompt) return { title: "Prompt Not Found" };
  return buildPromptMetadata(prompt as any);
}

export default async function PromptDetailPage({ params }: PageProps) {
  const prompt = await getPrompt(params.slug);
  if (!prompt) notFound();

  const { userId: clerkId } = await auth();

  // Check if user has purchased
  let hasPurchased = false;
  if (clerkId) {
    const buyer = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
    if (buyer) {
      const entry = await db.query.userLibrary.findFirst({
        where: and(eq(userLibrary.userId, buyer.id), eq(userLibrary.promptId, prompt.id)),
      });
      hasPurchased = !!entry;
    }
  }

  const relatedPrompts = await getRelatedPrompts(prompt);
  const price = parseFloat(prompt.price as string);
  const isFree = price === 0;
  const faqs = (prompt.faqs as any[]) || [];

  // Structured data
  const productJsonLd   = buildPromptJsonLd({ ...prompt, price, isFree, hasPurchased } as any);
  const faqJsonLd       = faqs.length ? buildFaqJsonLd(faqs) : null;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: SEO_CONFIG.siteUrl },
    { name: "Marketplace", url: `${SEO_CONFIG.siteUrl}/marketplace` },
    ...(prompt.category ? [{ name: prompt.category.name, url: `${SEO_CONFIG.siteUrl}/category/${prompt.category.slug}` }] : []),
    { name: prompt.title, url: `${SEO_CONFIG.siteUrl}/prompts/${prompt.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-zinc-400 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-violet-600">Home</Link>
          <span>/</span>
          <Link href="/marketplace" className="hover:text-violet-600">Marketplace</Link>
          {prompt.category && (
            <>
              <span>/</span>
              <Link href={`/category/${prompt.category.slug}`} className="hover:text-violet-600">
                {prompt.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-zinc-600 truncate">{prompt.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── LEFT: Main content ──────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title + badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {prompt.aiTool && <Badge>{prompt.aiTool.name}</Badge>}
                {prompt.category && <Badge variant="secondary">{prompt.category.name}</Badge>}
                {isFree && <Badge variant="free">FREE</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white leading-tight">
                {prompt.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                {(prompt.ratingCount ?? 0) > 0 && (
                  <StarRating rating={Number(prompt.ratingAvg ?? 0)} count={prompt.ratingCount ?? 0} size="md" />
                )}
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> {(prompt.viewCount ?? 0).toLocaleString()} views
                </span>
                <span>{(prompt.purchaseCount ?? 0).toLocaleString()} sales</span>
              </div>
            </div>

            {/* Example output */}
            {prompt.exampleImageUrl && (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-800">
                <Image src={prompt.exampleImageUrl} alt={`Example output: ${prompt.title}`} fill className="object-cover" />
                <div className="absolute bottom-3 left-3">
                  <Badge variant="secondary" className="text-xs">Example Output</Badge>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">About This Prompt</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {prompt.description}
              </p>
            </div>

            {/* Prompt preview / full text */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                  {hasPurchased || isFree ? "Full Prompt" : "Prompt Preview"}
                </span>
                {(hasPurchased || isFree) && (
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Copy className="h-4 w-4" /> Copy
                  </Button>
                )}
              </div>
              <div className="p-5 font-mono text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed relative">
                {hasPurchased || isFree ? (
                  <pre className="whitespace-pre-wrap">{prompt.promptText}</pre>
                ) : (
                  <div className="relative">
                    <pre className="whitespace-pre-wrap filter blur-sm select-none pointer-events-none text-zinc-400">
                      {prompt.previewText || prompt.promptText?.slice(0, 200) + "..."}
                    </pre>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-6 py-4 text-center shadow-lg">
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                          Purchase to unlock the full prompt
                        </p>
                        <PurchaseButton promptId={prompt.id} price={price} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Example text output */}
            {prompt.exampleOutput && (
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">Example Output</h2>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50/50 dark:bg-zinc-900/50">
                  <p className="whitespace-pre-wrap">{prompt.exampleOutput}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {(prompt.tags?.length ?? 0) > 0 && (
              <div>
                <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-3 text-sm uppercase tracking-wide">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {(prompt.tags as string[]).map((tag) => (
                    <Link key={tag} href={`/marketplace?tag=${tag}`}>
                      <Badge variant="outline" className="cursor-pointer hover:border-violet-300">#{tag}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {faqs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {faqs.map((faq: { q: string; a: string }, i: number) => (
                    <details key={i} className="group rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                      <summary className="flex items-center justify-between cursor-pointer font-medium text-zinc-900 dark:text-white list-none">
                        {faq.q}
                        <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-3 text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Purchase sidebar ──────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900 shadow-sm">
                <div className="text-4xl font-bold text-zinc-900 dark:text-white mb-1">
                  {isFree ? "Free" : `$${price.toFixed(2)}`}
                </div>
                {!isFree && (
                  <p className="text-sm text-zinc-400 mb-6">One-time purchase, yours forever</p>
                )}

                {hasPurchased ? (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4" />
                    You own this prompt
                  </div>
                ) : (
                  <PurchaseButton promptId={prompt.id} price={price} fullWidth />
                )}

                <div className="mt-4 space-y-2.5 text-sm text-zinc-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-500" /> Quality guarantee
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" /> Instant access
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-500" /> Works with {prompt.aiTool?.name || "AI tools"}
                  </div>
                </div>
              </div>

              {/* Seller card */}
              {prompt.seller && (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide mb-3">Seller</p>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={prompt.seller.avatarUrl}
                      name={prompt.seller.fullName || prompt.seller.username || "?"}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {prompt.seller.fullName || prompt.seller.username}
                        {prompt.seller.isVerified && (
                          <ShieldCheck className="h-3.5 w-3.5 inline ml-1 text-blue-500" />
                        )}
                      </p>
                      {prompt.seller.bio && (
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{prompt.seller.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related prompts */}
        {relatedPrompts.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Related Prompts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedPrompts.map((p) => (
                <PromptCard key={p.id} prompt={p as any} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
