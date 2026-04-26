// Real keyword data from Ubersuggest research (April 2026)
export const SEO_CONFIG = {
  siteName: "PromptMarket",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://promptmarket.io",
  defaultTitle: "PromptMarket – Buy & Sell AI Prompts | Best AI Prompts Marketplace",
  defaultDescription:
    "Discover the best AI prompts for ChatGPT, Midjourney, Claude, DALL-E, and Sora. Buy, sell, and share professional prompts. Free & premium.",
  twitterHandle: "@promptmarket",
  ogImage: "/og-default.jpg",
};

// Verified low-KD, high-volume keywords from competitive research
export const SEED_KEYWORDS = {
  primary: [
    { keyword: "best ai prompts", volume: 4400, pd: 9 },
    { keyword: "prompt marketplace", volume: 1600, pd: 8 },
    { keyword: "best ai prompts for image", volume: 1900, pd: 14 },
    { keyword: "sora prompts", volume: 1300, pd: 4 },
    { keyword: "ai photo prompts", volume: 1600, pd: 19 },
  ],
  quickWins: [
    { keyword: "how to sell prompts online", volume: 390, pd: 2 },
    { keyword: "how to sell prompts on promptbase", volume: 170, pd: 1 },
    { keyword: "best ai prompts reddit", volume: 140, pd: 3 },
  ],
};

// Programmatic SEO page templates
export const PROGRAMMATIC_TEMPLATES = {
  bestToolPrompts: "/best-{tool}-prompts-for-{usecase}",
  freeCategory: "/free-{category}-prompts",
  promptsForJob: "/prompts-for-{job}",
  toolPage: "/tool/{tool}",
  categoryPage: "/category/{category}",
};

// AI tools for tool pages (high-traffic targets)
export const AI_TOOLS = [
  { name: "ChatGPT", slug: "chatgpt", company: "OpenAI" },
  { name: "Claude", slug: "claude", company: "Anthropic" },
  { name: "Midjourney", slug: "midjourney", company: "Midjourney" },
  { name: "DALL-E 3", slug: "dalle", company: "OpenAI" },
  { name: "Sora", slug: "sora", company: "OpenAI" },
  { name: "Gemini", slug: "gemini", company: "Google" },
  { name: "Stable Diffusion", slug: "stable-diffusion", company: "Stability AI" },
  { name: "Grok", slug: "grok", company: "xAI" },
  { name: "Flux", slug: "flux", company: "Black Forest Labs" },
];

// Use cases for programmatic pages
export const USE_CASES = [
  "marketing", "coding", "writing", "design", "business",
  "social-media", "seo", "sales", "education", "photography",
  "email-marketing", "content-creation", "customer-service",
  "product-descriptions", "video-scripts", "blog-posts",
  "linkedin", "instagram", "twitter", "youtube",
  "resume-writing", "cover-letters", "job-search",
];

// Job titles for /prompts-for-{job} pages
export const JOB_TITLES = [
  "marketers", "developers", "designers", "writers", "entrepreneurs",
  "freelancers", "students", "teachers", "real-estate-agents",
  "copywriters", "social-media-managers", "content-creators",
  "coaches", "consultants", "photographers", "youtubers",
];
