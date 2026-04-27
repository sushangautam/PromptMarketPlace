import { NextRequest, NextResponse } from "next/server";
import { db, prompts, categories, aiTools } from "@/lib/db";
import { getOrCreateDbUser } from "@/lib/auth/getOrCreateUser";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  title:           z.string().min(10).max(120).optional(),
  description:     z.string().min(20).max(2000).optional(),
  promptText:      z.string().min(10).optional(),
  previewText:     z.string().max(500).optional(),
  exampleOutput:   z.string().optional(),
  categorySlug:    z.string().optional(),
  aiToolSlug:      z.string().optional(),
  tags:            z.array(z.string()).max(10).optional(),
  price:           z.number().min(0).max(999).optional(),
  metaTitle:       z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const seller = await getOrCreateDbUser();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const prompt = await db.query.prompts.findFirst({
    where: and(eq(prompts.id, id), eq(prompts.sellerId, seller.id)),
  });
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (data.title)           updates.title = data.title;
  if (data.description)     updates.description = data.description;
  if (data.promptText)      updates.promptText = data.promptText;
  if (data.previewText !== undefined) updates.previewText = data.previewText;
  if (data.exampleOutput !== undefined) updates.exampleOutput = data.exampleOutput;
  if (data.tags)            updates.tags = data.tags;
  if (data.price !== undefined) updates.price = data.price.toString();
  if (data.metaTitle !== undefined)       updates.metaTitle = data.metaTitle;
  if (data.metaDescription !== undefined) updates.metaDescription = data.metaDescription;

  if (data.categorySlug) {
    const cat = await db.query.categories.findFirst({ where: eq(categories.slug, data.categorySlug) });
    if (cat) updates.categoryId = cat.id;
  }
  if (data.aiToolSlug) {
    const tool = await db.query.aiTools.findFirst({ where: eq(aiTools.slug, data.aiToolSlug) });
    if (tool) updates.aiToolId = tool.id;
  }

  const [updated] = await db.update(prompts).set(updates).where(eq(prompts.id, id)).returning();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const seller = await getOrCreateDbUser();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const prompt = await db.query.prompts.findFirst({
    where: and(eq(prompts.id, id), eq(prompts.sellerId, seller.id)),
  });
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(prompts).where(eq(prompts.id, id));
  return NextResponse.json({ success: true });
}
