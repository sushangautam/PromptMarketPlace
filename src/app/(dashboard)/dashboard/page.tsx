import { redirect } from "next/navigation";
import { db, prompts, purchases } from "@/lib/db";
import { getOrCreateDbUser } from "@/lib/auth/getOrCreateUser";
import { eq, and, sum, count, desc } from "drizzle-orm";
import { DollarSign, TrendingUp, Eye, Package, Star, ArrowUpRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Dashboard | PromptMarket" };

async function getSellerStats(userId: string) {
  const [revenueResult, salesResult, viewsResult, promptsResult] = await Promise.all([
    db.select({ total: sum(purchases.sellerPayout) })
      .from(purchases)
      .where(and(
        eq(purchases.sellerId, userId),
        eq(purchases.status, "completed"),
      )),
    db.select({ total: count() })
      .from(purchases)
      .where(and(
        eq(purchases.sellerId, userId),
        eq(purchases.status, "completed"),
      )),
    db.select({ total: sum(prompts.viewCount) })
      .from(prompts)
      .where(eq(prompts.sellerId, userId)),
    db.select({ total: count() })
      .from(prompts)
      .where(eq(prompts.sellerId, userId)),
  ]);

  const topPrompts = await db.query.prompts.findMany({
    where: eq(prompts.sellerId, userId),
    orderBy: desc(prompts.purchaseCount),
    limit: 5,
    columns: { id: true, title: true, slug: true, price: true, purchaseCount: true, viewCount: true, ratingAvg: true, status: true },
  });

  return {
    revenue:    parseFloat(revenueResult[0]?.total as string || "0"),
    sales:      Number(salesResult[0]?.total || 0),
    views:      Number(viewsResult[0]?.total || 0),
    totalPrompts: Number(promptsResult[0]?.total || 0),
    topPrompts,
  };
}

export default async function DashboardPage() {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/login");
  if (user.role === "buyer") redirect("/become-seller");

  const stats = await getSellerStats(user.id);

  const statCards = [
    { label: "Total Revenue", value: formatPrice(stats.revenue), icon: <DollarSign className="h-5 w-5" />, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
    { label: "Total Sales", value: stats.sales.toLocaleString(), icon: <TrendingUp className="h-5 w-5" />, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
    { label: "Total Views", value: stats.views.toLocaleString(), icon: <Eye className="h-5 w-5" />, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/30" },
    { label: "Active Prompts", value: stats.totalPrompts.toLocaleString(), icon: <Package className="h-5 w-5" />, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Welcome back, {user.fullName || user.username}</p>
        </div>
        <Link href="/dashboard/prompts/new">
          <Button variant="gradient">+ New Prompt</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardBody className="flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Top Prompts */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Top Prompts</h2>
            <Link href="/dashboard/prompts">
              <Button variant="ghost" size="sm">View All <ArrowUpRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </div>

          <div className="space-y-3">
            {stats.topPrompts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <Link href={`/prompts/${p.slug}`} className="font-medium text-zinc-900 dark:text-white hover:text-violet-600 truncate block">
                    {p.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                    <span><Eye className="h-3 w-3 inline mr-1" />{p.viewCount ?? 0}</span>
                    <span>{p.purchaseCount ?? 0} sales</span>
                    {Number(p.ratingAvg ?? 0) > 0 && (
                      <span><Star className="h-3 w-3 inline mr-1 fill-amber-400 text-amber-400" />{Number(p.ratingAvg).toFixed(1)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {formatPrice(parseFloat(p.price as string) * (p.purchaseCount ?? 0) * 0.8)}
                  </span>
                  <Badge variant={p.status === "active" ? "success" : "warning"}>
                    {p.status}
                  </Badge>
                </div>
              </div>
            ))}
            {stats.topPrompts.length === 0 && (
              <div className="text-center py-8 text-zinc-400">
                <Package className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p>No prompts yet.</p>
                <Link href="/dashboard/prompts/new">
                  <Button size="sm" className="mt-3">Upload your first prompt</Button>
                </Link>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Payout CTA */}
      {!user.stripeAccountId && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-300">Connect Stripe to receive payouts</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">You need a connected Stripe account to receive earnings from sales.</p>
          </div>
          <Link href="/dashboard/earnings">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">Connect Stripe</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
