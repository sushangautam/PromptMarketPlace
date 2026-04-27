import { NextRequest, NextResponse } from "next/server";
import { db, prompts, purchases, userLibrary } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { createCheckoutSession, calcFees } from "@/lib/payments/stripe";
import { createRazorpayOrder } from "@/lib/payments/razorpay";
import { getOrCreateDbUser } from "@/lib/auth/getOrCreateUser";

const purchaseSchema = z.object({
  promptId: z.string().uuid(),
  provider: z.enum(["stripe", "razorpay"]).default("stripe"),
});

export async function POST(req: NextRequest) {
  const buyer = await getOrCreateDbUser();
  if (!buyer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { promptId, provider } = parsed.data;

  const prompt = await db.query.prompts.findFirst({
    where: and(eq(prompts.id, promptId), eq(prompts.status, "active")),
    with: { seller: true },
  });
  if (!prompt) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });

  // Check already purchased
  const existing = await db.query.userLibrary.findFirst({
    where: and(eq(userLibrary.userId, buyer.id), eq(userLibrary.promptId, promptId)),
  });
  if (existing) return NextResponse.json({ error: "Already purchased" }, { status: 409 });

  const amount = parseFloat(prompt.price as string);
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL!;

  // Free prompt — add to library directly
  if (amount === 0) {
    await db.insert(userLibrary).values({
      userId: buyer.id, promptId, source: "free",
    }).onConflictDoNothing();
    return NextResponse.json({ success: true, free: true });
  }

  if (provider === "stripe") {
    if (!prompt.seller?.stripeAccountId) {
      return NextResponse.json({ error: "Seller not connected to Stripe" }, { status: 400 });
    }
    const session = await createCheckoutSession({
      promptId,
      buyerEmail:          buyer.email,
      amount,
      sellerStripeAccountId: prompt.seller.stripeAccountId,
      successUrl: `${origin}/prompts/${prompt.slug}?purchased=1&session={CHECKOUT_SESSION_ID}`,
      cancelUrl:  `${origin}/prompts/${prompt.slug}?cancelled=1`,
    });
    return NextResponse.json({ url: session.url });
  }

  // Razorpay (India)
  const order = await createRazorpayOrder({ promptId, amountUsd: amount });
  return NextResponse.json({
    orderId:     order.id,
    amount:      order.amount,
    currency:    order.currency,
    keyId:       process.env.RAZORPAY_KEY_ID,
  });
}

// GET /api/v1/purchases — buyer's library check
export async function GET(req: NextRequest) {
  const buyer = await getOrCreateDbUser();
  if (!buyer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const library = await db.query.userLibrary.findMany({
    where: eq(userLibrary.userId, buyer.id),
    with: { prompt: { with: { aiTool: true, category: true } } },
  });

  return NextResponse.json(library);
}
