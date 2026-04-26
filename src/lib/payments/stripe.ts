import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Platform takes 20% commission
export const PLATFORM_FEE_PERCENT = 0.20;

export function calcFees(amount: number) {
  const platformFee = parseFloat((amount * PLATFORM_FEE_PERCENT).toFixed(2));
  const sellerPayout = parseFloat((amount - platformFee).toFixed(2));
  return { platformFee, sellerPayout };
}

export async function createCheckoutSession({
  promptId,
  buyerEmail,
  amount,
  currency = "usd",
  sellerStripeAccountId,
  successUrl,
  cancelUrl,
}: {
  promptId: string;
  buyerEmail: string;
  amount: number;
  currency?: string;
  sellerStripeAccountId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const amountCents = Math.round(amount * 100);
  const { platformFee } = calcFees(amount);
  const feeCents = Math.round(platformFee * 100);

  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: buyerEmail,
    line_items: [
      {
        price_data: {
          currency,
          product_data: { name: "AI Prompt", metadata: { promptId } },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: feeCents,
      transfer_data: { destination: sellerStripeAccountId },
    },
    metadata: { promptId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

export async function createSellerConnectAccount(email: string, name?: string | null): Promise<string> {
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: { transfers: { requested: true } },
    ...(name ? { business_profile: { name } } : {}),
  });
  return account.id;
}

export async function createSellerOnboardingLink(accountId: string, returnUrl: string, refreshUrl: string) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

export async function createSubscriptionCheckout({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  customerId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}
