import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { db, prompts, categories, aiTools } from "@/lib/db";
import { eq, and, gte, lte, desc, asc, ilike, sql } from "drizzle-orm";
import { PromptCard } from "@/components/prompts/PromptCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO_CONFIG, AI_TOOLS } from "@/config/seo";
import { buildBreadcrumbJsonLd } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Browse AI Prompts – Marketplace",
  description:
    "Browse 10,000+ professional AI prompts for ChatGPT, Midjourney, Claude, DALL-E & Sora. Filter by category, tool, price. Free & premium.",
  alternates: { canonical: `${SEO_CONFIG.siteUrl}/marketplace` },
};

export const revalidate = 300;

const SORT_OPTIONS = [
  { value: "newest",    label: "Newest" },
  { value: "popular",  label: "Most Popular" },
  { value: "top-rated",label: "Top Rated" },
  { value: "price-asc",label: "Price: Low → High" },
  { value: "price-desc",label: "Price: High → Low" },
];

const CATEGORIES_FILTER = [
  { name: "All",          slug: "" },
  { name: "Marketing",   slug: "marketing" },
  { name: "Coding",      slug: "coding" },
  { name: "Design",      slug: "design" },
  { name: "Writing",     slug: "writing" },
  { name: "Business",    slug: "business" },
  { name: "Education",   slug: "education" },
  { name: "Photography", slug: "photography" },
  { name: "Social Media",slug: "social-media" },
  { name: "Video",       slug: "video" },
];

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tool?: string;
    sort?: string;
    free?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}

async function getPrompts(params: Awaited<PageProps["searchParams"]>) {
  const page    = Math.max(1, parseInt(params.page || "1"));
  const perPage = 24;
  const offset  = (page - 1) * perPage;

  const conditions: ReturnType<typeof eq>[] = [eq(prompts.status, "active")];

  if (params.free === "true") {
    conditions.push(eq(prompts.price, "0"));
  } else {
    if (params.minPrice) conditions.push(gte(prompts.price, params.minPrice));
    if (params.maxPrice) conditions.push(lte(prompts.price, params.maxPrice));
  }

  let orderBy;
  switch (params.sort) {
    case "popular":   orderBy = desc(prompts.purchaseCount); break;
    case "top-rated": orderBy = desc(prompts.ratingAvg); break;
    case "price-asc": orderBy = asc(prompts.price); break;
    case "price-desc":orderBy = desc(prompts.price); break;
    default:          orderBy = desc(prompts.createdAt);
  }

  const results = await db.query.prompts.findMany({
    where: and(...conditions),
    orderBy,
    limit: perPage,
    offset,
    with: { seller: true, category: true, aiTool: true },
    columns: { promptText: false },
  });

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(prompts)
    .where(and(...conditions));

  return { prompts: results, total, page, perPage };
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { prompts: items, total, page, perPage } = await getPrompts(params);
  const totalPages = Math.ceil(total / perPage);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", url: SEO_CONFIG.siteUrl },
    { name: "Marketplace", url: `${SEO_CONFIG.siteUrl}/marketplace` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="min-h-screen bg-white dark:bg-zinc-950">
        {/* ── PAGE HEADER ── */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">AI Prompt Marketplace</h1>
            <p className="text-zinc-500 text-sm">{total.toLocaleString()} prompts available</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ── SIDEBAR FILTERS ── */}
            <aside className="w-full lg:w-64 shrink-0 space-y-6">
              {/* Search */}
              <form method="GET" action="/marketplace">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <input
                    name="q"
                    defaultValue={params.q}
                    placeholder="Search prompts…"
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-zinc-100"
                  />
                </div>
              </form>

              {/* Categories */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Category</h3>
                <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                  {CATEGORIES_FILTER.map((cat) => {
                    const isActive = (params.category || "") === cat.slug;
                    const href = cat.slug
                      ? `?${new URLSearchParams({ ...params, category: cat.slug, page: "1" })}`
                      : `?${new URLSearchParams({ ...params, page: "1", category: "" }).toString().replace("category=&", "").replace(/&?category=$/, "")}`;
                    return (
                      <Link
                        key={cat.slug}
                        href={href}
                        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 font-medium"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {cat.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* AI Tools */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">AI Tool</h3>
                <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                  <Link
                    href={`?${new URLSearchParams({ ...params, page: "1", tool: "" }).toString().replace("tool=&", "").replace(/&?tool=$/, "")}`}
                    className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      !params.tool ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 font-medium" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    All Tools
                  </Link>
                  {AI_TOOLS.map((tool) => {
                    const isActive = params.tool === tool.slug;
                    return (
                      <Link
                        key={tool.slug}
                        href={`?${new URLSearchParams({ ...params, tool: tool.slug, page: "1" })}`}
                        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 font-medium"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {tool.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Price */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Price</h3>
                <div className="flex flex-col gap-1">
                  {[
                    { label: "All Prices", free: "", min: "", max: "" },
                    { label: "Free only",  free: "true", min: "", max: "" },
                    { label: "Under $5",   free: "", min: "0.01", max: "5" },
                    { label: "$5 – $20",   free: "", min: "5", max: "20" },
                    { label: "$20+",       free: "", min: "20", max: "" },
                  ].map((opt) => {
                    const isActive =
                      (params.free || "") === opt.free &&
                      (params.minPrice || "") === opt.min &&
                      (params.maxPrice || "") === opt.max;
                    const sp = new URLSearchParams({ ...params, page: "1" });
                    if (opt.free) sp.set("free", opt.free); else sp.delete("free");
                    if (opt.min)  sp.set("minPrice", opt.min); else sp.delete("minPrice");
                    if (opt.max)  sp.set("maxPrice", opt.max); else sp.delete("maxPrice");
                    return (
                      <Link
                        key={opt.label}
                        href={`?${sp}`}
                        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 font-medium"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {opt.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 gap-4">
                <div className="flex flex-wrap gap-2">
                  {params.category && (
                    <Badge variant="secondary" className="gap-1.5">
                      {params.category}
                      <Link href={`?${new URLSearchParams({ ...params, category: "", page: "1" }).toString().replace(/&?category=$/, "")}`} className="ml-1 text-zinc-400 hover:text-zinc-600">×</Link>
                    </Badge>
                  )}
                  {params.tool && (
                    <Badge variant="secondary" className="gap-1.5">
                      {params.tool}
                      <Link href={`?${new URLSearchParams({ ...params, tool: "", page: "1" }).toString().replace(/&?tool=$/, "")}`} className="ml-1 text-zinc-400 hover:text-zinc-600">×</Link>
                    </Badge>
                  )}
                  {params.free === "true" && (
                    <Badge variant="free" className="gap-1.5">
                      Free only
                      <Link href={`?${new URLSearchParams({ ...params, free: "", page: "1" }).toString().replace(/&?free=$/, "")}`} className="ml-1 text-emerald-600 hover:text-emerald-800">×</Link>
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-zinc-500 hidden sm:block">Sort:</span>
                  <div className="relative">
                    <select
                      defaultValue={params.sort || "newest"}
                      onChange={(e) => {
                        const url = new URL(window.location.href);
                        url.searchParams.set("sort", e.target.value);
                        url.searchParams.set("page", "1");
                        window.location.href = url.toString();
                      }}
                      className="appearance-none h-9 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-zinc-100"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Grid */}
              {items.length === 0 ? (
                <div className="text-center py-24 text-zinc-400">
                  <Search className="h-10 w-10 mx-auto mb-4 opacity-30" />
                  <p className="font-medium text-zinc-600 dark:text-zinc-300 mb-1">No prompts found</p>
                  <p className="text-sm">Try adjusting your filters or search terms.</p>
                  <Link href="/marketplace">
                    <Button variant="outline" size="sm" className="mt-4">Clear filters</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {items.map((prompt) => (
                    <PromptCard key={prompt.id} prompt={prompt as any} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {page > 1 && (
                    <Link href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>
                      <Button variant="outline" size="sm">← Prev</Button>
                    </Link>
                  )}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <Link key={p} href={`?${new URLSearchParams({ ...params, page: String(p) })}`}>
                        <Button variant={p === page ? "default" : "outline"} size="sm">{p}</Button>
                      </Link>
                    );
                  })}
                  {page < totalPages && (
                    <Link href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>
                      <Button variant="outline" size="sm">Next →</Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
