import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getOrCreateDbUser } from "@/lib/auth/getOrCreateUser";

export async function POST() {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "seller") {
    return NextResponse.json({ alreadySeller: true });
  }

  await db.update(users)
    .set({ role: "seller" })
    .where(eq(users.id, user.id));

  return NextResponse.json({ success: true });
}
