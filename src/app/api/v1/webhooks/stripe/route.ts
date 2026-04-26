import { NextRequest, NextResponse } from "next/server";
import { stripe, calcFees } from "@/lib/payments/stripe";
import { db, purchases, prompts, users, userLibrary } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const promptId = session.metadata?.promptId;
    if (!promptId) return NextResponse.json({ ok: true });

    const prompt = await db.query.prompts.findFirst({
      where: eq(prompts.id, promptId),
    });
    if (!prompt) return NextResponse.json({ ok: true });

    const buyer = await db.query.users.findFirst({
      where: eq(users.email, session.customer_email!),
    });
    if (!buyer) return NextResponse.json({ ok: true });

    const amount       = (session.amount_total || 0) / 100;
    const { platformFee, sellerPayout } = calcFees(amount);

    await db.transaction(async (tx) => {
      await tx.insert(purchases).values({
        buyerId:         buyer.id,
        sellerId:        prompt.sellerId,
        promptId,
        amount:          amount.toString(),
        currency:        session.currency?.toUpperCase() || "USD",
        platformFee:     platformFee.toString(),
        sellerPayout:    sellerPayout.toString(),
        paymentProvider: "stripe",
        paymentIntentId: session.payment_intent as string,
        status:          "completed",
      });

      await tx.insert(userLibrary).values({
        userId:   buyer.id,
        promptId,
        source:   "purchase",
      }).onConflictDoNothing();

      // Increment prompt purchase count
      await tx.update(prompts)
        .set({ purchaseCount: sql`${prompts.purchaseCount} + 1` })
        .where(eq(prompts.id, promptId));
    });
  }

  return NextResponse.json({ ok: true });
}

// Disable body parsing — Stripe needs raw body
export const config = { api: { bodyParser: false } };
