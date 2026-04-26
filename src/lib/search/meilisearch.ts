import MeiliSearch from "meilisearch";
import type { Prompt } from "@/types";

export const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_API_KEY,
});

export const PROMPTS_INDEX = "prompts";

export async function setupMeiliIndex() {
  const index = meili.index(PROMPTS_INDEX);

  await index.updateSettings({
    searchableAttributes: ["title", "description", "tags", "aiToolName", "categoryName"],
    filterableAttributes: ["categorySlug", "aiToolSlug", "price", "isFree", "status", "tags"],
    sortableAttributes: ["createdAt", "price", "ratingAvg", "purchaseCount", "viewCount"],
    rankingRules: [
      "words", "typo", "proximity", "attribute", "sort", "exactness",
    ],
    typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
  });
}

export interface SearchablePrompt {
  id: string;
  title: string;
  slug: string;
  description: string;
  previewText: string | null;
  exampleImageUrl: string | null;
  price: number;
  isFree: boolean;
  tags: string[];
  categorySlug: string | null;
  categoryName: string | null;
  aiToolSlug: string | null;
  aiToolName: string | null;
  sellerName: string | null;
  ratingAvg: number;
  ratingCount: number;
  purchaseCount: number;
  viewCount: number;
  createdAt: number; // unix timestamp for sorting
  status: string;
}

export async function indexPrompt(prompt: SearchablePrompt) {
  const index = meili.index(PROMPTS_INDEX);
  return index.addDocuments([prompt]);
}

export async function removePromptFromIndex(id: string) {
  const index = meili.index(PROMPTS_INDEX);
  return index.deleteDocument(id);
}

export async function searchPrompts({
  query = "",
  filters = {},
  sort = "createdAt:desc",
  page = 1,
  limit = 20,
}: {
  query?: string;
  filters?: {
    categorySlug?: string;
    aiToolSlug?: string;
    minPrice?: number;
    maxPrice?: number;
    isFree?: boolean;
    tags?: string[];
  };
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const index = meili.index(PROMPTS_INDEX);

  const filterParts: string[] = ['status = "active"'];

  if (filters.categorySlug) filterParts.push(`categorySlug = "${filters.categorySlug}"`);
  if (filters.aiToolSlug) filterParts.push(`aiToolSlug = "${filters.aiToolSlug}"`);
  if (filters.isFree === true) filterParts.push("isFree = true");
  if (filters.minPrice !== undefined) filterParts.push(`price >= ${filters.minPrice}`);
  if (filters.maxPrice !== undefined) filterParts.push(`price <= ${filters.maxPrice}`);
  if (filters.tags?.length) {
    filterParts.push(`tags IN [${filters.tags.map((t) => `"${t}"`).join(",")}]`);
  }

  return index.search(query, {
    filter: filterParts.join(" AND "),
    sort: [sort],
    offset: (page - 1) * limit,
    limit,
    attributesToHighlight: ["title", "description"],
  });
}
