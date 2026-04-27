import { currentUser } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Returns the DB user for the current Clerk session.
 * Creates the user row on first call (lazy sync — no webhook needed).
 */
export async function getOrCreateDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUser.id),
  });
  if (existing) return existing;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const rawName = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();
  const username = clerkUser.username
    ?? email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase();

  const [newUser] = await db
    .insert(users)
    .values({
      clerkId:   clerkUser.id,
      email,
      fullName:  rawName || null,
      username,
      avatarUrl: clerkUser.imageUrl || null,
      role:      "buyer",
    })
    .returning();

  return newUser;
}
