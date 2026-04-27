import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Globe, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PromptCard } from "@/components/prompts/PromptCard";
import { SEO_CONFIG, AI_TOOLS } from "@/config/seo";
import { db, prompts } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { buildBreadcrumbJsonLd } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: `${SEO_CONFIG.siteName} – Best AI Prompts Marketplace | Buy & Sell Prompts`,
  description: "Discover 10,000+ professional AI prompts for ChatGPT, Midjourney, Claude, DALL-E & Sora. Free & premium. Boost your productivity today.",
  openGraph: {
    type: "website",
    title: `${SEO_CONFIG.siteName} – Best AI Prompts Marketplace`,
    description: "The world's best AI prompt marketplace. Buy, sell, and discover prompts that actually work.",
    url: SEO_CONFIG.siteUrl,
    images: [{ url: `${SEO_CONFIG.siteUrl}/og-home.jpg`, width: 1200, height: 630 }],
  },
  alternates: { canonical: SEO_CONFIG.siteUrl },
};

const CATEGORIES_DISPLAY = [
  { name: "Marketing",    slug: "marketing",    icon: "📣", count: 2400 },
  { name: "Coding",       slug: "coding",       icon: "💻", count: 1800 },
  { name: "Design",       slug: "design",       icon: "🎨", count: 1500 },
  { name: "Writing",      slug: "writing",      icon: "✍️",  count: 3200 },
  { name: "Business",     slug: "business",     icon: "💼", count: 900  },
  { name: "Education",    slug: "education",    icon: "📚", count: 600  },
  { name: "Photography",  slug: "photography",  icon: "📸", count: 750  },
  { name: "Social Media", slug: "social-media", icon: "📱", count: 1100 },
];

export const revalidate = 3600;

async function getFeaturedPrompts() {
  return db.query.prompts.findMany({
    where: and(eq(prompts.status, "active"), eq(prompts.isFeatured, true)),
    orderBy: desc(prompts.createdAt),
    limit: 8,
    with: { seller: true, category: true, aiTool: true },
    columns: { promptText: false },
  });
}

async function getLatestFreePrompts() {
  return db.query.prompts.findMany({
    where: and(eq(prompts.status, "active"), eq(prompts.price, "0")),
    orderBy: desc(prompts.createdAt),
    limit: 4,
    with: { seller: true, category: true, aiTool: true },
    columns: { promptText: false },
  });
}

export default async function HomePage() {
  const [featured, freePrompts] = await Promise.all([
    getFeaturedPrompts(),
    getLatestFreePrompts(),
  ]);

  const jsonLd = buildBreadcrumbJsonLd([{ name: "Home", url: SEO_CONFIG.siteUrl }]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-zinc-950 pt-24 pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-violet-100/60 via-indigo-50/40 to-transparent dark:from-violet-950/30 dark:via-indigo-950/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center max-w-4xl">
          <Badge className="mb-6 text-sm px-4 py-1.5">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            10,000+ Professional AI Prompts
          </Badge>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.1] mb-6">
            The Best AI Prompts{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Marketplace
            </span>
          </h1>

          <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Buy and sell expert prompts for ChatGPT, Midjourney, Claude, Sora & more.
            Stop writing bad prompts — start getting results.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace">
              <Button size="xl" variant="gradient" className="w-full sm:w-auto">
                Browse Prompts
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sell">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                Start Selling
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-500">
            {[
              { value: "10K+", label: "Prompts" },
              { value: "5K+",  label: "Sellers" },
              { value: "50K+", label: "Buyers" },
              { value: "4.8★", label: "Avg Rating" },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</span>
                {" "}{stat.label}
                {i < 3 && <div className="ml-8 w-px h-8 bg-zinc-200 dark:bg-zinc-800" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI TOOLS STRIP ───────────────────────────────────── */}
      <section className="border-y border-zinc-100 dark:border-zinc-800 py-6 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {AI_TOOLS.map((tool) => (
              <Link key={tool.slug} href={`/tool/${tool.slug}`}>
                <Badge variant="outline" className="text-sm px-3 py-1.5 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-colors cursor-pointer">
                  {tool.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────────────── */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">Browse by Category</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Find exactly what you need</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {CATEGORIES_DISPLAY.map((cat) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`}>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all group text-center">
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-violet-600">{cat.name}</span>
                <span className="text-xs text-zinc-400">{cat.count.toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PROMPTS ─────────────────────────────────── */}
      <section className="py-20 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Featured Prompts</h2>
              <p className="text-zinc-500">Handpicked by our team</p>
            </div>
            <Link href="/marketplace">
              <Button variant="outline" size="sm">View All <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt as any} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FREE PROMPTS ─────────────────────────────────────── */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Free AI Prompts</h2>
            <p className="text-zinc-500">Start for free, upgrade anytime</p>
          </div>
          <Link href="/free-ai-prompts">
            <Button variant="outline" size="sm">All Free <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {freePrompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt as any} />
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="py-20 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Shield className="h-6 w-6 text-violet-600" />, title: "Quality Guaranteed",  desc: "Every prompt is reviewed by our team. If it doesn't work, we refund." },
              { icon: <Globe  className="h-6 w-6 text-violet-600" />, title: "Global Payments",     desc: "Pay with card via Stripe worldwide. UPI & Net Banking via Razorpay for India." },
              { icon: <TrendingUp className="h-6 w-6 text-violet-600" />, title: "Earn as a Seller", desc: "Keep 80% of every sale. Set your own prices. Get paid weekly." },
            ].map((f) => (
              <div key={f.title} className="flex flex-col gap-4 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="p-2.5 bg-violet-50 dark:bg-violet-950/30 rounded-lg w-fit">{f.icon}</div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO LINKS ────────────────────────────────────────── */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">Popular Collections</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { href: "/best-chatgpt-prompts-for-marketing", label: "Best ChatGPT prompts for marketing" },
            { href: "/best-midjourney-prompts-for-design",  label: "Best Midjourney prompts for design" },
            { href: "/best-claude-prompts-for-writing",     label: "Best Claude prompts for writing" },
            { href: "/best-sora-prompts-for-video",         label: "Best Sora prompts for video" },
            { href: "/free-marketing-prompts",              label: "Free marketing prompts" },
            { href: "/free-coding-prompts",                 label: "Free coding prompts" },
            { href: "/prompts-for-marketers",               label: "Prompts for marketers" },
            { href: "/prompts-for-developers",              label: "Prompts for developers" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 underline-offset-4 hover:underline transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-24 container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-12 text-center text-white">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <h2 className="text-4xl font-bold mb-4">Start selling your prompts today</h2>
            <p className="text-violet-100 text-lg mb-8 max-w-xl mx-auto">
              Join 5,000+ creators earning passive income. Upload in 5 minutes, earn forever.
            </p>
            <Link href="/become-seller">
              <Button size="xl" className="bg-white text-violet-700 hover:bg-violet-50">
                Create Your Store Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
