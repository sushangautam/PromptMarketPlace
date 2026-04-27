import { redirect } from "next/navigation";
import Link from "next/link";
import { db, prompts } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getOrCreateDbUser } from "@/lib/auth/getOrCreateUser";
import { Plus, Eye, ShoppingCart, Star, Edit, Trash2, Package } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "My Prompts – Dashboard" };

export default async function SellerPromptsPage() {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/login");
  if (user.role === "buyer") redirect("/become-seller");

  const myPrompts = await db.query.prompts.findMany({
    where: eq(prompts.sellerId, user.id),
    orderBy: desc(prompts.createdAt),
    with: { category: true, aiTool: true },
    columns: { promptText: false },
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">My Prompts</h1>
          <p className="text-zinc-500 mt-1">{myPrompts.length} prompts in your store</p>
        </div>
        <Link href="/dashboard/prompts/new">
          <Button variant="gradient" className="gap-2">
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
        </Link>
      </div>

      {myPrompts.length === 0 ? (
        <Card>
          <CardBody className="py-20 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
            <p className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">No prompts yet</p>
            <p className="text-zinc-500 text-sm mb-6">Upload your first prompt to start earning.</p>
            <Link href="/dashboard/prompts/new">
              <Button variant="gradient">Upload Your First Prompt</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prompt</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Category</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Price</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Sales</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Views</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden lg:table-cell">Rating</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {myPrompts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-4">
                        <Link
                          href={`/prompts/${p.slug}`}
                          className="font-medium text-zinc-900 dark:text-white hover:text-violet-600 line-clamp-1 block max-w-xs"
                        >
                          {p.title}
                        </Link>
                        {p.aiTool && (
                          <span className="text-xs text-zinc-400 mt-0.5 block">{p.aiTool.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        {p.category && (
                          <Badge variant="secondary">{p.category.name}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-zinc-900 dark:text-white">
                        {formatPrice(parseFloat(p.price as string))}
                      </td>
                      <td className="px-4 py-4 text-right text-zinc-500 hidden sm:table-cell">
                        <span className="flex items-center justify-end gap-1">
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {p.purchaseCount}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-zinc-500 hidden sm:table-cell">
                        <span className="flex items-center justify-end gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {(p.viewCount ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right hidden lg:table-cell">
                        {Number(p.ratingAvg ?? 0) > 0 ? (
                          <span className="flex items-center justify-end gap-1 text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {Number(p.ratingAvg).toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={
                          p.status === "active" ? "success" :
                          p.status === "pending" ? "warning" : "danger"
                        }>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/prompts/${p.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
