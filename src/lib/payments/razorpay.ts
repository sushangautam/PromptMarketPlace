import Razorpay from "razorpay";
import crypto from "crypto";
import { PLATFORM_FEE_PERCENT, calcFees } from "./stripe";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Convert USD to INR (use live rate in production)
export async function usdToInr(usdAmount: number): Promise<number> {
  const rate = parseFloat(process.env.USD_TO_INR_RATE || "83");
  return Math.round(usdAmount * rate * 100); // Razorpay uses paise
}

export async function createRazorpayOrder({
  promptId,
  amountUsd,
}: {
  promptId: string;
  amountUsd: number;
}) {
  const amountPaise = await usdToInr(amountUsd);

  return razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `prompt_${promptId}_${Date.now()}`,
    notes: { promptId },
  });
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return expected === signature;
}
