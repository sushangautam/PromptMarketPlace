import { NextRequest, NextResponse } from "next/server";
import { db, prompts, categories, aiTools } from "@/lib/db";
import { getOrCreateDbUser } from "@/lib/auth/getOrCreateUser";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import slugify from "slugify";
import { indexPrompt } from "@/lib/search/meilisearch";

const createPromptSchema = z.object({
  title:           z.string().min(10).max(120),
  description:     z.string().min(20).max(2000),
  promptText:      z.string().min(10),
  previewText:     z.string().max(500).optional(),
  exampleOutput:   z.string().optional(),
  categoryId:      z.string().uuid().optional(),
  categorySlug:    z.string().optional(),   // form sends this
  aiToolId:        z.string().uuid().optional(),
  aiToolSlug:      z.string().optional(),   // form sends this
  tags:            z.array(z.string()).max(10).default([]),
  price:           z.number().min(0).max(999),
  metaTitle:       z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  faqs:            z.array(z.object({ q: z.string(), a: z.string() })).default([]),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page     = parseInt(searchParams.get("page") || "1");
  const limit    = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const category = searchParams.get("category");
  const tool     = searchParams.get("tool");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const isFree   = searchParams.get("free") === "1";

  const conditions = [eq(prompts.status, "active")];
  if (isFree)    conditions.push(eq(prompts.price, "0"));
  if (minPrice)  conditions.push(gte(prompts.price, minPrice));
  if (maxPrice)  conditions.push(lte(prompts.price, maxPrice));

  if (category) {
    const cat = await db.query.categories.findFirst({ where: eq(categories.slug, category) });
    if (cat) conditions.push(eq(prompts.categoryId, cat.id));
  }
  if (tool) {
    const t = await db.query.aiTools.findFirst({ where: eq(aiTools.slug, tool) });
    if (t) conditions.push(eq(prompts.aiToolId, t.id));
  }

  const [rows, [{ count }]] = await Promise.all([
    db.query.prompts.findMany({
      where: and(...conditions),
      orderBy: desc(prompts.createdAt),
      limit,
      offset: (page - 1) * limit,
      with: {
        seller:   { columns: { id: true, username: true, fullName: true, avatarUrl: true, isVerified: true } },
        category: true,
        aiTool:   true,
      },
      columns: { promptText: false }, // never expose full prompt in listing
    }),
    db.select({ count: sql<number>`count(*)` }).from(prompts).where(and(...conditions)),
  ]);

  return NextResponse.json({
    data: rows,
    total: Number(count),
    page,
    limit,
    hasMore: (page - 1) * limit + rows.length < Number(count),
  });
}

export async function POST(req: NextRequest) {
  const seller = await getOrCreateDbUser();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (seller.role === "buyer") return NextResponse.json({ error: "Become a seller first" }, { status: 403 });

  const body = await req.json();
  const parsed = createPromptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const baseSlug = slugify(data.title, { lower: true, strict: true });
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  // Resolve slugs → IDs if the client sent slugs instead of UUIDs
  let categoryId = data.categoryId;
  if (!categoryId && data.categorySlug) {
    const cat = await db.query.categories.findFirst({ where: eq(categories.slug, data.categorySlug) });
    categoryId = cat?.id;
  }
  let aiToolId = data.aiToolId;
  if (!aiToolId && data.aiToolSlug) {
    const tool = await db.query.aiTools.findFirst({ where: eq(aiTools.slug, data.aiToolSlug) });
    aiToolId = tool?.id;
  }

  const [prompt] = await db.insert(prompts).values({
    sellerId:       seller.id,
    title:          data.title,
    slug,
    description:    data.description,
    promptText:     data.promptText,
    previewText:    data.previewText,
    exampleOutput:  data.exampleOutput,
    categoryId,
    aiToolId,
    tags:           data.tags,
    price:          data.price.toString(),
    metaTitle:      data.metaTitle,
    metaDescription: data.metaDescription,
    faqs:           data.faqs,
    status:         "pending",
  }).returning();

  // Index in Meilisearch
  await indexPrompt({
    id:           prompt.id,
    title:        prompt.title,
    slug:         prompt.slug,
    description:  prompt.description,
    previewText:  prompt.previewText,
    exampleImageUrl: null,
    price:        parseFloat(prompt.price as string),
    isFree:       parseFloat(prompt.price as string) === 0,
    tags:         prompt.tags as string[],
    categorySlug: null,
    categoryName: null,
    aiToolSlug:   null,
    aiToolName:   null,
    sellerName:   seller.fullName || seller.username,
    ratingAvg:    0,
    ratingCount:  0,
    purchaseCount: 0,
    viewCount:    0,
    createdAt:    Date.now(),
    status:       "pending",
  });

  return NextResponse.json(prompt, { status: 201 });
}
