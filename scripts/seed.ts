/**
 * Seed script: populates categories, AI tools, a demo seller, and sample prompts.
 * Run: npm run db:seed
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db     = drizzle(client, { schema });

const CATEGORIES = [
  { name: "Marketing",    slug: "marketing",    icon: "📣", description: "Ads, copy, campaigns, and marketing strategy prompts" },
  { name: "Coding",       slug: "coding",       icon: "💻", description: "Code review, debugging, and development prompts" },
  { name: "Design",       slug: "design",       icon: "🎨", description: "UI/UX, branding, logo, and visual design prompts" },
  { name: "Writing",      slug: "writing",      icon: "✍️",  description: "Blog posts, storytelling, and creative writing prompts" },
  { name: "Business",     slug: "business",     icon: "💼", description: "Strategy, analysis, and business development prompts" },
  { name: "Education",    slug: "education",    icon: "📚", description: "Teaching, studying, and tutoring prompts" },
  { name: "Photography",  slug: "photography",  icon: "📸", description: "Photo editing, composition, and style prompts" },
  { name: "Social Media", slug: "social-media", icon: "📱", description: "Instagram, LinkedIn, TikTok, and social content" },
  { name: "Video",        slug: "video",        icon: "🎬", description: "YouTube scripts, video concepts, and production" },
  { name: "Other",        slug: "other",        icon: "⚡", description: "Miscellaneous AI prompts" },
];

const AI_TOOLS = [
  { name: "ChatGPT",          slug: "chatgpt",          websiteUrl: "https://chat.openai.com" },
  { name: "Claude",           slug: "claude",           websiteUrl: "https://claude.ai" },
  { name: "Midjourney",       slug: "midjourney",       websiteUrl: "https://midjourney.com" },
  { name: "DALL-E 3",         slug: "dalle",            websiteUrl: "https://openai.com/dall-e-3" },
  { name: "Sora",             slug: "sora",             websiteUrl: "https://openai.com/sora" },
  { name: "Gemini",           slug: "gemini",           websiteUrl: "https://gemini.google.com" },
  { name: "Stable Diffusion", slug: "stable-diffusion", websiteUrl: "https://stability.ai" },
  { name: "Grok",             slug: "grok",             websiteUrl: "https://x.ai" },
  { name: "Flux",             slug: "flux",             websiteUrl: "https://blackforestlabs.ai" },
];

async function seed() {
  console.log("🌱 Seeding database…\n");

  // Categories
  console.log("→ Inserting categories…");
  const insertedCats = await db
    .insert(schema.categories)
    .values(CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })))
    .onConflictDoNothing()
    .returning({ id: schema.categories.id, slug: schema.categories.slug });
  console.log(`  ✓ ${insertedCats.length} categories`);

  // AI Tools
  console.log("→ Inserting AI tools…");
  const insertedTools = await db
    .insert(schema.aiTools)
    .values(AI_TOOLS)
    .onConflictDoNothing()
    .returning({ id: schema.aiTools.id, slug: schema.aiTools.slug });
  console.log(`  ✓ ${insertedTools.length} AI tools`);

  // Demo seller
  console.log("→ Inserting demo seller…");
  const [seller] = await db
    .insert(schema.users)
    .values({
      clerkId:  "seed_demo_seller",
      email:    "demo@promptmarket.io",
      username: "promptmarket",
      fullName: "PromptMarket Team",
      role:     "seller",
      isVerified: true,
    })
    .onConflictDoNothing()
    .returning({ id: schema.users.id });

  if (!seller) {
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, "demo@promptmarket.io"),
    });
    if (!existing) { console.error("Could not create demo seller"); process.exit(1); }
    console.log("  ✓ demo seller already exists");
  } else {
    console.log(`  ✓ created demo seller ${seller.id}`);
  }

  const sellerId = seller?.id || (await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, "demo@promptmarket.io"),
  }))!.id;

  // Build lookup maps
  const catMap  = Object.fromEntries(
    (await db.query.categories.findMany()).map((c) => [c.slug, c.id])
  );
  const toolMap = Object.fromEntries(
    (await db.query.aiTools.findMany()).map((t) => [t.slug, t.id])
  );

  // Sample prompts
  const samplePrompts = [
    {
      title: "Ultimate SEO Blog Post Writer – Rank #1 on Google",
      slug: "ultimate-seo-blog-post-writer",
      description: "A battle-tested ChatGPT prompt that creates fully SEO-optimized blog posts with proper keyword density, H2/H3 structure, and meta descriptions. Paste your keyword and get a complete 1,500-word post in seconds.",
      promptText: `You are an expert SEO content writer. Write a comprehensive, SEO-optimized blog post about [KEYWORD].

Requirements:
- Length: 1,500–2,000 words
- Include a compelling H1 title with the keyword
- Add 4–6 H2 subheadings with LSI keywords
- Write in a conversational but authoritative tone
- Include a meta description (155 chars max)
- Add a FAQ section with 3–5 questions at the end
- Use the keyword naturally in the first 100 words
- Include a clear CTA at the end

Start with the meta description (labeled), then the full post.`,
      previewText: "You are an expert SEO content writer. Write a comprehensive, SEO-optimized blog post about [KEYWORD]...",
      categoryId: catMap["marketing"],
      aiToolId: toolMap["chatgpt"],
      price: "9.99",
      tags: ["seo", "blog", "content-writing", "marketing", "copywriting"],
      status: "active" as const,
      isFeatured: true,
      purchaseCount: 342,
      viewCount: 4521,
      ratingAvg: "4.8",
      ratingCount: 89,
    },
    {
      title: "Midjourney Product Photography – Clean White Background",
      slug: "midjourney-product-photography-white",
      description: "Instantly create stunning product photography with clean white or gradient backgrounds. Perfect for e-commerce, Amazon listings, and Shopify stores. Tested on 200+ products.",
      promptText: `[PRODUCT DESCRIPTION] product photography, clean white background, soft studio lighting, professional commercial photography, high-key lighting, sharp details, 85mm lens, f/8 aperture, 4K resolution, Photorealistic, product showcase --ar 1:1 --style raw --v 6`,
      previewText: "[PRODUCT DESCRIPTION] product photography, clean white background, soft studio lighting...",
      categoryId: catMap["photography"],
      aiToolId: toolMap["midjourney"],
      price: "4.99",
      tags: ["product-photography", "e-commerce", "midjourney", "amazon", "shopify"],
      status: "active" as const,
      isFeatured: true,
      purchaseCount: 891,
      viewCount: 12043,
      ratingAvg: "4.9",
      ratingCount: 201,
    },
    {
      title: "LinkedIn Viral Post Generator – 10x Your Reach",
      slug: "linkedin-viral-post-generator",
      description: "Generate highly engaging LinkedIn posts that follow the hook-story-CTA formula used by top creators. Just enter your topic and get 3 ready-to-post variants.",
      promptText: `You are a LinkedIn content expert who has helped 50+ founders build audiences of 100K+ followers.

Write 3 LinkedIn post variants about [TOPIC] using this proven structure:
1. Hook (1 line, creates curiosity or controversy)
2. Story/insight (3–5 short paragraphs, max 3 lines each)
3. Key lesson (bulleted list of 3–5 takeaways)
4. Call to action (a question to drive comments)

Rules:
- No emojis in the hook
- Use line breaks aggressively (every 2–3 sentences)
- First line must stop the scroll
- Write conversationally, not corporately

Topic: [TOPIC]
My perspective/angle: [YOUR ANGLE]`,
      previewText: "You are a LinkedIn content expert who has helped 50+ founders build audiences...",
      categoryId: catMap["social-media"],
      aiToolId: toolMap["chatgpt"],
      price: "7.99",
      tags: ["linkedin", "social-media", "content", "personal-branding", "viral"],
      status: "active" as const,
      isFeatured: true,
      purchaseCount: 556,
      viewCount: 7832,
      ratingAvg: "4.7",
      ratingCount: 134,
    },
    {
      title: "Code Review & Bug Finder – Senior Engineer Mode",
      slug: "code-review-bug-finder-senior-engineer",
      description: "Paste any code snippet and get a thorough senior engineer code review. Identifies bugs, security issues, performance problems, and style improvements with explanations.",
      promptText: `You are a senior software engineer with 15+ years of experience reviewing production code. Review the following code and provide:

1. **Critical Issues** (bugs, security vulnerabilities, data loss risks)
2. **Performance Problems** (N+1 queries, memory leaks, inefficient algorithms)
3. **Code Smell & Maintainability** (naming, complexity, duplication)
4. **Best Practice Violations** (language idioms, patterns, conventions)
5. **Suggested Improvements** (with code examples for each fix)

Be specific. Reference line numbers. Explain WHY each issue matters.

Code to review:
\`\`\`
[PASTE YOUR CODE HERE]
\`\`\`

Language/Framework: [LANGUAGE]`,
      previewText: "You are a senior software engineer with 15+ years of experience reviewing production code...",
      categoryId: catMap["coding"],
      aiToolId: toolMap["claude"],
      price: "0",
      tags: ["code-review", "debugging", "programming", "software-engineering", "free"],
      status: "active" as const,
      isFeatured: false,
      purchaseCount: 1203,
      viewCount: 18430,
      ratingAvg: "4.9",
      ratingCount: 312,
    },
    {
      title: "Sora Video Script – Cinematic AI Film Generator",
      slug: "sora-cinematic-video-script",
      description: "Generate cinematic Sora prompts that produce stunning short films. Includes camera angles, lighting, mood, and motion instructions. Perfect for creators and filmmakers.",
      promptText: `Cinematic [SCENE DESCRIPTION], [TIME OF DAY] golden hour lighting, [CAMERA MOVEMENT] tracking shot, [MOOD] atmosphere, film grain, anamorphic lens flare, shallow depth of field, [COLOR PALETTE] color grading, photorealistic, 8K, [DURATION]s`,
      previewText: "Cinematic [SCENE DESCRIPTION], [TIME OF DAY] golden hour lighting, [CAMERA MOVEMENT] tracking shot...",
      categoryId: catMap["video"],
      aiToolId: toolMap["sora"],
      price: "14.99",
      tags: ["sora", "video", "cinematic", "filmmaking", "ai-video"],
      status: "active" as const,
      isFeatured: true,
      purchaseCount: 178,
      viewCount: 3201,
      ratingAvg: "4.6",
      ratingCount: 42,
    },
    {
      title: "Free Email Subject Line Generator – 10x Open Rates",
      slug: "free-email-subject-line-generator",
      description: "Generate 20 high-converting email subject lines using proven psychological triggers. Free to use — just enter your email topic.",
      promptText: `You are an email marketing expert who has written 10,000+ subject lines.

Generate 20 email subject lines for: [EMAIL TOPIC]

Include these psychological triggers (4 lines each):
1. Curiosity gap ("The one thing…", "Why most people…")
2. Urgency/scarcity ("[Last chance]", "24 hours left")
3. Personalization ("[First name]", "For [audience]")
4. Specific numbers ("7 ways to…", "83% of…")
5. Question format ("Are you making this mistake?")

Format each with: Subject line | Trigger type | Predicted open rate range`,
      previewText: "You are an email marketing expert who has written 10,000+ subject lines. Generate 20 email subject lines...",
      categoryId: catMap["marketing"],
      aiToolId: toolMap["chatgpt"],
      price: "0",
      tags: ["email", "marketing", "copywriting", "conversion", "free"],
      status: "active" as const,
      isFeatured: false,
      purchaseCount: 2341,
      viewCount: 31200,
      ratingAvg: "4.8",
      ratingCount: 567,
    },
  ];

  console.log("→ Inserting sample prompts…");
  let inserted = 0;
  for (const p of samplePrompts) {
    const [row] = await db
      .insert(schema.prompts)
      .values({ ...p, sellerId })
      .onConflictDoNothing()
      .returning({ id: schema.prompts.id });
    if (row) inserted++;
  }
  console.log(`  ✓ ${inserted} prompts`);

  console.log("\n✅ Seed complete!");
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
