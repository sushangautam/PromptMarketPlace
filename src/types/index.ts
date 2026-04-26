export type UserRole = "buyer" | "seller" | "admin";
export type PromptStatus = "draft" | "pending" | "active" | "rejected" | "archived";
export type PaymentProvider = "stripe" | "razorpay";
export type PurchaseStatus = "pending" | "completed" | "refunded" | "failed";

export interface User {
  id: string;
  clerkId: string;
  email: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  stripeAccountId: string | null;
  isVerified: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  promptCount: number;
}

export interface AiTool {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  promptCount: number;
}

export interface Prompt {
  id: string;
  sellerId: string;
  seller?: Pick<User, "id" | "username" | "fullName" | "avatarUrl" | "isVerified">;
  title: string;
  slug: string;
  description: string;
  promptText?: string;     // only after purchase
  previewText: string | null;
  exampleOutput: string | null;
  exampleImageUrl: string | null;
  categoryId: string | null;
  category?: Category;
  aiToolId: string | null;
  aiTool?: AiTool;
  tags: string[];
  price: number;
  currency: string;
  isFree: boolean;
  status: PromptStatus;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  faqs: FAQ[];
  viewCount: number;
  purchaseCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
  // computed
  hasPurchased?: boolean;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface Bundle {
  id: string;
  sellerId: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  prompts: Prompt[];
  isActive: boolean;
}

export interface Review {
  id: string;
  promptId: string;
  buyerId: string;
  buyer?: Pick<User, "id" | "username" | "fullName" | "avatarUrl">;
  rating: number;
  body: string | null;
  createdAt: Date;
}

export interface Purchase {
  id: string;
  buyerId: string;
  promptId: string | null;
  prompt?: Prompt;
  bundleId: string | null;
  amount: number;
  currency: string;
  platformFee: number;
  sellerPayout: number;
  paymentProvider: PaymentProvider;
  status: PurchaseStatus;
  createdAt: Date;
}

export interface SearchFilters {
  query?: string;
  categorySlug?: string;
  aiToolSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  isFree?: boolean;
  sortBy?: "newest" | "popular" | "top-rated" | "price-asc" | "price-desc";
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SellerStats {
  totalRevenue: number;
  totalSales: number;
  totalViews: number;
  totalPrompts: number;
  avgRating: number;
  pendingPayout: number;
  topPrompts: Array<Prompt & { revenue: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}
