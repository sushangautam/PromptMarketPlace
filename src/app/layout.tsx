import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SEO_CONFIG } from "@/config/seo";
import { NavbarAuth } from "@/components/layout/NavbarAuth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.siteUrl),
  title: {
    default:  SEO_CONFIG.defaultTitle,
    template: `%s | ${SEO_CONFIG.siteName}`,
  },
  description:  SEO_CONFIG.defaultDescription,
  keywords:     ["ai prompts", "prompt marketplace", "chatgpt prompts", "midjourney prompts", "buy ai prompts", "sell prompts"],
  authors:      [{ name: SEO_CONFIG.siteName }],
  creator:      SEO_CONFIG.siteName,
  openGraph: { type: "website", siteName: SEO_CONFIG.siteName, locale: "en_US" },
  twitter: { card: "summary_large_image", creator: SEO_CONFIG.twitterHandle },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#09090b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning className={`${inter.className} bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased`}>
          <Navbar />
          <main className="pt-16">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <a href="/" className="font-bold text-xl text-zinc-900 dark:text-white">
          Prompt<span className="text-violet-600">Market</span>
        </a>
        <div className="flex items-center gap-6 text-sm">
          <a href="/marketplace" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Browse</a>
          <a href="/sell" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Sell</a>
          <a href="/blog" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Blog</a>
          <NavbarAuth />
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const cols = [
    { title: "Product",   links: [{ href: "/marketplace", label: "Browse Prompts" }, { href: "/sell", label: "Start Selling" }] },
    { title: "Tools",     links: [{ href: "/tool/chatgpt", label: "ChatGPT Prompts" }, { href: "/tool/midjourney", label: "Midjourney Prompts" }, { href: "/tool/claude", label: "Claude Prompts" }] },
    { title: "Resources", links: [{ href: "/blog", label: "Blog" }, { href: "/free-ai-prompts", label: "Free Prompts" }] },
    { title: "Company",   links: [{ href: "/about", label: "About" }, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }] },
  ];
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 mt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <p className="font-bold text-xl mb-2">Prompt<span className="text-violet-600">Market</span></p>
            <p className="text-sm text-zinc-400">The world's best AI prompt marketplace.</p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300 mb-3">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}><a href={l.href} className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-400 flex justify-between">
          <p>© {new Date().getFullYear()} PromptMarket. All rights reserved.</p>
          <p>Secured by Stripe & Razorpay.</p>
        </div>
      </div>
    </footer>
  );
}
