import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, DollarSign, Users, Zap, Shield, Globe, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO_CONFIG } from "@/config/seo";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Sell AI Prompts – Earn Money with Your Prompts",
  description:
    "Turn your AI prompts into passive income. Join 5,000+ sellers on PromptMarket. Keep 80% of every sale. Free to join. Start selling in 5 minutes.",
  alternates: { canonical: `${SEO_CONFIG.siteUrl}/sell` },
};

const FAQS = [
  { q: "How much can I earn?", a: "You keep 80% of every sale. Top sellers earn $500–$5,000/month. There's no cap — set your own prices and sell globally." },
  { q: "How do I get paid?", a: "Payouts are sent weekly via Stripe Connect directly to your bank account. No minimum balance required." },
  { q: "What prompts sell best?", a: "High-quality prompts for ChatGPT (marketing, writing, coding) and Midjourney (product photography, logos) consistently sell well. Specific, detailed prompts with examples outperform vague ones." },
  { q: "Is it free to sell?", a: "Yes — joining and listing prompts is completely free. We only take a 20% platform fee when you make a sale." },
  { q: "Can I sell prompts for any AI tool?", a: "Yes. We support ChatGPT, Claude, Midjourney, DALL-E 3, Sora, Stable Diffusion, Gemini, Grok, Flux, and more." },
];

export default function SellPage() {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", url: SEO_CONFIG.siteUrl },
    { name: "Sell Prompts", url: `${SEO_CONFIG.siteUrl}/sell` },
  ]);
  const faqJsonLd = buildFaqJsonLd(FAQS);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white dark:bg-zinc-950 pt-24 pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-gradient-to-bl from-violet-100/50 to-transparent dark:from-violet-950/20 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
                <DollarSign className="h-3.5 w-3.5" />
                80% Revenue Share
              </div>
              <h1 className="text-5xl font-bold text-zinc-900 dark:text-white leading-tight mb-5">
                Sell Your AI Prompts.{" "}
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Earn Passive Income.
                </span>
              </h1>
              <p className="text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
                Join 5,000+ creators who earn money from their AI expertise. Upload once, sell forever. Global payments via Stripe & Razorpay.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/become-seller">
                  <Button size="xl" variant="gradient" className="w-full sm:w-auto">
                    Start Selling Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto">
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats card */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 space-y-6">
              {[
                { label: "Average monthly earnings", value: "$840", sub: "across all active sellers" },
                { label: "Prompts sold this month", value: "12,400", sub: "+34% from last month" },
                { label: "Your revenue share", value: "80%", sub: "we only take 20%" },
                { label: "Payout frequency", value: "Weekly", sub: "via Stripe Connect" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">{stat.label}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{stat.sub}</p>
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">How it works</h2>
            <p className="text-zinc-500">Get your first sale in under 24 hours</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", icon: <Users className="h-6 w-6" />, title: "Create Account", desc: "Sign up free with Google or email. Takes 30 seconds." },
              { step: "2", icon: <Zap className="h-6 w-6" />, title: "Upload Prompt", desc: "Write your title, description, and set a price. Add tags for discoverability." },
              { step: "3", icon: <Globe className="h-6 w-6" />, title: "Reach Buyers", desc: "Your prompt is instantly searchable by thousands of buyers worldwide." },
              { step: "4", icon: <DollarSign className="h-6 w-6" />, title: "Get Paid", desc: "Earn 80% of every sale. Weekly payouts to your bank via Stripe." },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">
                  {item.step}
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Shield className="h-6 w-6 text-violet-600" />, title: "Secure Payments", desc: "Payments processed by Stripe. Supports cards, Apple Pay, Google Pay, and Razorpay for India buyers." },
            { icon: <TrendingUp className="h-6 w-6 text-violet-600" />, title: "SEO-Optimized", desc: "Every prompt gets its own indexed page with schema markup. Buyers find you on Google — no ads needed." },
            { icon: <Globe className="h-6 w-6 text-violet-600" />, title: "Global Reach", desc: "Sell to buyers in 180+ countries. INR pricing for India via Razorpay. Automatic currency conversion." },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="p-2.5 bg-violet-50 dark:bg-violet-950/30 rounded-lg w-fit mb-4">{f.icon}</div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <h3 className="font-semibold text-zinc-900 dark:text-white flex items-start gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-12 text-center text-white">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <h2 className="text-4xl font-bold mb-4">Ready to start earning?</h2>
            <p className="text-violet-100 text-lg mb-8 max-w-xl mx-auto">
              Free to join. No monthly fees. Upload your first prompt in 5 minutes.
            </p>
            <Link href="/become-seller">
              <Button size="xl" className="bg-white text-violet-700 hover:bg-violet-50">
                Create Your Free Account
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
