"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  DollarSign, Upload, Globe, Zap, CheckCircle,
  ArrowRight, Loader2, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BENEFITS = [
  { icon: <DollarSign className="h-5 w-5 text-violet-600" />, title: "Keep 80% of every sale", desc: "We only take a 20% platform fee. Set your own prices." },
  { icon: <Upload        className="h-5 w-5 text-violet-600" />, title: "Upload in minutes",      desc: "Simple form — title, prompt text, price. Go live instantly." },
  { icon: <Globe         className="h-5 w-5 text-violet-600" />, title: "Sell globally",           desc: "Stripe for cards worldwide. Razorpay for India buyers." },
  { icon: <Zap           className="h-5 w-5 text-violet-600" />, title: "SEO-powered discovery",  desc: "Every prompt gets its own indexed page. Buyers find you on Google." },
  { icon: <ShieldCheck   className="h-5 w-5 text-violet-600" />, title: "Weekly payouts",         desc: "Earnings sent to your bank every week via Stripe Connect." },
  { icon: <CheckCircle   className="h-5 w-5 text-violet-600" />, title: "Free to join",           desc: "No subscription, no listing fees. Pay only when you earn." },
];

export function BecomeSeller() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBecomeSeller() {
    if (!isSignedIn) {
      router.push("/signup?redirect=/become-seller");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/users/become-seller", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push("/dashboard/prompts/new?welcome=1");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Hero */}
      <div className="relative overflow-hidden pt-20 pb-16 border-b border-zinc-100 dark:border-zinc-800">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-br from-violet-100/60 to-transparent dark:from-violet-950/25 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
            <Zap className="h-3.5 w-3.5" />
            Join 5,000+ sellers already earning
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white leading-tight mb-4">
            Turn your AI expertise into{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              passive income
            </span>
          </h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto mb-8">
            Upload once, sell forever. You keep 80% of every sale. No monthly fees.
          </p>

          {error && (
            <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          {isLoaded && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="xl"
                variant="gradient"
                onClick={handleBecomeSeller}
                isLoading={loading}
                className="gap-2"
              >
                {!loading && <Zap className="h-5 w-5" />}
                {isSignedIn ? "Activate Seller Account" : "Start Selling Free"}
              </Button>
              <Link href="/marketplace">
                <Button size="xl" variant="outline">Browse Prompts</Button>
              </Link>
            </div>
          )}

          {!isLoaded && <div className="h-12" />}

          {isSignedIn && (
            <p className="mt-4 text-xs text-zinc-400">
              Your account will be upgraded instantly. No credit card required.
            </p>
          )}
          {!isSignedIn && isLoaded && (
            <p className="mt-4 text-xs text-zinc-400">
              Already have an account?{" "}
              <Link href="/login?redirect=/become-seller" className="text-violet-600 hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Benefits grid */}
      <div className="container mx-auto px-4 py-20 max-w-5xl">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white text-center mb-12">
          Everything you need to sell prompts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-200 dark:hover:border-violet-800 transition-colors"
            >
              <div className="p-2.5 bg-violet-50 dark:bg-violet-950/30 rounded-lg w-fit mb-4">
                {b.icon}
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">{b.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-zinc-50/50 dark:bg-zinc-900/50 py-20 border-t border-zinc-100 dark:border-zinc-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white text-center mb-12">
            Up and running in 3 steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Activate seller account",  desc: "Click the button above. Takes 1 second. No forms, no approval wait." },
              { step: "2", title: "Upload your first prompt", desc: "Add a title, your prompt text, set a price, and publish." },
              { step: "3", title: "Start earning",            desc: "Buyers find your prompt via search and Google. You get paid weekly." },
            ].map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                  {s.step}
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
                {s.step !== "3" && (
                  <ArrowRight className="hidden md:block absolute top-4 -right-4 h-5 w-5 text-zinc-300" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="xl"
              variant="gradient"
              onClick={handleBecomeSeller}
              isLoading={loading}
            >
              {isSignedIn ? "Activate Seller Account" : "Get Started Free"}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
