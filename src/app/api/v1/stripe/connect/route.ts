import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createSellerConnectAccount, createSellerOnboardingLink } from "@/lib/payments/stripe";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.redirect("/login");

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) return NextResponse.redirect("/login");

  try {
    let accountId = user.stripeAccountId;

    if (!accountId) {
      accountId = await createSellerConnectAccount(user.email, user.fullName || user.username);
      await db.update(users)
        .set({ stripeAccountId: accountId })
        .where(eq(users.id, user.id));
    }

    const link = await createSellerOnboardingLink(
      accountId,
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/earnings?stripe=success`,
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/earnings?stripe=refresh`,
    );
    const url = link.url;

    return NextResponse.redirect(url);
  } catch (err) {
    console.error("Stripe connect error:", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/earnings?error=stripe`);
  }
}
