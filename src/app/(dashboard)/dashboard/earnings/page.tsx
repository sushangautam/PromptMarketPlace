import { redirect } from "next/navigation";
import { db, purchases } from "@/lib/db";
import { getOrCreateDbUser } from "@/lib/auth/getOrCreateUser";
import { eq, and, desc, sum, count } from "drizzle-orm";
import { DollarSign, ArrowUpRight, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Earnings – Dashboard" };

async function getEarnings(userId: string) {
  const [completed] = await db
    .select({ total: sum(purchases.sellerPayout), sales: count() })
    .from(purchases)
    .where(and(eq(purchases.sellerId, userId), eq(purchases.status, "completed")));

  const recent = await db.query.purchases.findMany({
    where: eq(purchases.sellerId, userId),
    orderBy: desc(purchases.createdAt),
    limit: 20,
    with: { prompt: { columns: { title: true, slug: true } } },
  });

  return {
    totalEarned: parseFloat(completed.total as string || "0"),
    totalSales: Number(completed.sales || 0),
    recent,
  };
}

export default async function EarningsPage() {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/login");
  if (user.role === "buyer") redirect("/become-seller");

  const { totalEarned, totalSales, recent } = await getEarnings(user.id);

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Earnings</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{formatPrice(totalEarned)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Total Earned</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalSales}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Total Sales</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">80%</p>
              <p className="text-xs text-zinc-500 mt-0.5">Your Revenue Share</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Stripe Connect banner */}
      {!user.stripeAccountId ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-300 text-lg">
                Connect Stripe to receive payouts
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                You need a Stripe Connect account to withdraw your earnings. Setup takes 5 minutes.
              </p>
            </div>
            <Link href="/api/v1/stripe/connect">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 gap-2">
                <ExternalLink className="h-4 w-4" />
                Connect Stripe
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-5 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-300">Stripe Connected</p>
            <p className="text-sm text-green-700 dark:text-green-400">Payouts are sent weekly to your bank account.</p>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Recent Transactions</h2>

          {recent.length === 0 ? (
            <p className="text-center py-10 text-zinc-400">No transactions yet. Share your prompts to start earning!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <th className="text-left pb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prompt</th>
                    <th className="text-right pb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Gross</th>
                    <th className="text-right pb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Cut</th>
                    <th className="text-center pb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="text-right pb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {recent.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3">
                        <Link
                          href={`/prompts/${tx.prompt?.slug}`}
                          className="text-zinc-900 dark:text-white hover:text-violet-600 font-medium"
                        >
                          {tx.prompt?.title || "Deleted prompt"}
                        </Link>
                      </td>
                      <td className="py-3 text-right text-zinc-500">
                        {formatPrice(parseFloat(tx.amount as string))}
                      </td>
                      <td className="py-3 text-right font-semibold text-green-600">
                        {formatPrice(parseFloat(tx.sellerPayout as string))}
                      </td>
                      <td className="py-3 text-center">
                        <Badge variant={tx.status === "completed" ? "success" : tx.status === "pending" ? "warning" : "danger"}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-zinc-400">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
