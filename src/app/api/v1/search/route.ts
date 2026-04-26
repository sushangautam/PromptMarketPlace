import { NextRequest, NextResponse } from "next/server";
import { searchPrompts } from "@/lib/search/meilisearch";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const query    = searchParams.get("q")        || "";
  const category = searchParams.get("category") || undefined;
  const tool     = searchParams.get("tool")     || undefined;
  const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
  const isFree   = searchParams.get("free") === "1" ? true : undefined;
  const page     = parseInt(searchParams.get("page") || "1");
  const limit    = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const sort     = searchParams.get("sort") || "createdAt:desc";

  const result = await searchPrompts({
    query,
    filters: { categorySlug: category, aiToolSlug: tool, minPrice, maxPrice, isFree },
    sort,
    page,
    limit,
  });

  return NextResponse.json({
    data:    result.hits,
    total:   result.estimatedTotalHits,
    page,
    limit,
    hasMore: (page - 1) * limit + result.hits.length < (result.estimatedTotalHits || 0),
    query,
  });
}
