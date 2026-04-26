import {
  pgTable, uuid, text, numeric, boolean, integer,
  timestamp, jsonb, index, uniqueIndex,
  customType, pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["buyer", "seller", "admin"]);
export const promptStatusEnum = pgEnum("prompt_status", ["draft", "pending", "active", "rejected", "archived"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["stripe", "razorpay"]);
export const purchaseStatusEnum = pgEnum("purchase_status", ["pending", "completed", "refunded", "failed"]);

const tsvector = customType<{ data: string }>({
  dataType() { return "tsvector"; },
});

// ─── USERS ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id:                  uuid("id").primaryKey().defaultRandom(),
  clerkId:             text("clerk_id").notNull().unique(),
  email:               text("email").notNull().unique(),
  username:            text("username").unique(),
  fullName:            text("full_name"),
  avatarUrl:           text("avatar_url"),
  bio:                 text("bio"),
  role:                userRoleEnum("role").notNull().default("buyer"),
  stripeCustomerId:    text("stripe_customer_id"),
  razorpayCustomerId:  text("razorpay_customer_id"),
  stripeAccountId:     text("stripe_account_id"),
  isVerified:          boolean("is_verified").default(false),
  createdAt:           timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:           timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        text("name").notNull(),
  slug:        text("slug").notNull().unique(),
  description: text("description"),
  icon:        text("icon"),
  parentId:    uuid("parent_id"),
  sortOrder:   integer("sort_order").default(0),
  promptCount: integer("prompt_count").default(0),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── AI TOOLS ────────────────────────────────────────────────────────────────

export const aiTools = pgTable("ai_tools", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        text("name").notNull(),
  slug:        text("slug").notNull().unique(),
  logoUrl:     text("logo_url"),
  description: text("description"),
  websiteUrl:  text("website_url"),
  promptCount: integer("prompt_count").default(0),
  isActive:    boolean("is_active").default(true),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── PROMPTS ─────────────────────────────────────────────────────────────────

export const prompts = pgTable("prompts", {
  id:               uuid("id").primaryKey().defaultRandom(),
  sellerId:         uuid("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title:            text("title").notNull(),
  slug:             text("slug").notNull().unique(),
  description:      text("description").notNull(),
  promptText:       text("prompt_text").notNull(),
  previewText:      text("preview_text"),
  exampleOutput:    text("example_output"),
  exampleImageUrl:  text("example_image_url"),
  categoryId:       uuid("category_id").references(() => categories.id),
  aiToolId:         uuid("ai_tool_id").references(() => aiTools.id),
  tags:             text("tags").array().default(sql`'{}'::text[]`),
  price:            numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  currency:         text("currency").default("USD"),
  status:           promptStatusEnum("status").default("draft"),
  isFeatured:       boolean("is_featured").default(false),
  metaTitle:        text("meta_title"),
  metaDescription:  text("meta_description"),
  faqs:             jsonb("faqs").default([]),
  viewCount:        integer("view_count").default(0),
  purchaseCount:    integer("purchase_count").default(0),
  ratingAvg:        numeric("rating_avg", { precision: 3, scale: 2 }).default("0"),
  ratingCount:      integer("rating_count").default(0),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  categoryIdx:  index("idx_prompts_category").on(table.categoryId),
  toolIdx:      index("idx_prompts_tool").on(table.aiToolId),
  sellerIdx:    index("idx_prompts_seller").on(table.sellerId),
  statusIdx:    index("idx_prompts_status").on(table.status),
  ratingIdx:    index("idx_prompts_rating").on(table.ratingAvg),
  createdIdx:   index("idx_prompts_created").on(table.createdAt),
}));

// ─── PURCHASES ───────────────────────────────────────────────────────────────

export const purchases = pgTable("purchases", {
  id:              uuid("id").primaryKey().defaultRandom(),
  buyerId:         uuid("buyer_id").notNull().references(() => users.id),
  sellerId:        uuid("seller_id").references(() => users.id),
  promptId:        uuid("prompt_id").references(() => prompts.id),
  bundleId:        uuid("bundle_id"),
  amount:          numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency:        text("currency").default("USD"),
  platformFee:     numeric("platform_fee", { precision: 10, scale: 2 }),
  sellerPayout:    numeric("seller_payout", { precision: 10, scale: 2 }),
  paymentProvider: paymentProviderEnum("payment_provider"),
  paymentIntentId: text("payment_intent_id"),
  status:          purchaseStatusEnum("status").default("pending"),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  buyerIdx:  index("idx_purchases_buyer").on(table.buyerId),
  sellerIdx: index("idx_purchases_seller").on(table.sellerId),
  promptIdx: index("idx_purchases_prompt").on(table.promptId),
}));

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

export const reviews = pgTable("reviews", {
  id:         uuid("id").primaryKey().defaultRandom(),
  promptId:   uuid("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  buyerId:    uuid("buyer_id").notNull().references(() => users.id),
  purchaseId: uuid("purchase_id").notNull().references(() => purchases.id),
  rating:     integer("rating").notNull(),
  body:       text("body"),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueReview: uniqueIndex("unique_review").on(table.promptId, table.buyerId),
}));

// ─── USER LIBRARY ─────────────────────────────────────────────────────────────

export const userLibrary = pgTable("user_library", {
  userId:   uuid("user_id").notNull().references(() => users.id),
  promptId: uuid("prompt_id").notNull().references(() => prompts.id),
  source:   text("source").default("purchase"),
  addedAt:  timestamp("added_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: uniqueIndex("user_library_pk").on(table.userId, table.promptId),
}));

export const userSaved = pgTable("user_saved", {
  userId:   uuid("user_id").notNull().references(() => users.id),
  promptId: uuid("prompt_id").notNull().references(() => prompts.id),
  savedAt:  timestamp("saved_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: uniqueIndex("user_saved_pk").on(table.userId, table.promptId),
}));

// ─── SEO PAGES ───────────────────────────────────────────────────────────────

export const seoPages = pgTable("seo_pages", {
  id:          uuid("id").primaryKey().defaultRandom(),
  pageType:    text("page_type").notNull(),
  slug:        text("slug").notNull().unique(),
  title:       text("title").notNull(),
  h1:          text("h1").notNull(),
  description: text("description"),
  introHtml:   text("intro_html"),
  faqs:        jsonb("faqs").default([]),
  aiToolId:    uuid("ai_tool_id").references(() => aiTools.id),
  categoryId:  uuid("category_id").references(() => categories.id),
  keywords:    text("keywords").array(),
  isPublished: boolean("is_published").default(false),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── BLOG ────────────────────────────────────────────────────────────────────

export const blogPosts = pgTable("blog_posts", {
  id:              uuid("id").primaryKey().defaultRandom(),
  authorId:        uuid("author_id").references(() => users.id),
  title:           text("title").notNull(),
  slug:            text("slug").notNull().unique(),
  excerpt:         text("excerpt"),
  content:         text("content").notNull(),
  coverImage:      text("cover_image"),
  tags:            text("tags").array(),
  metaTitle:       text("meta_title"),
  metaDescription: text("meta_description"),
  status:          text("status").default("draft"), // draft | published
  isPublished:     boolean("is_published").default(false),
  publishedAt:     timestamp("published_at", { withTimezone: true }),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── RELATIONS ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  prompts:       many(prompts),
  purchases:     many(purchases, { relationName: "buyer" }),
  sales:         many(purchases, { relationName: "seller" }),
  reviews:       many(reviews),
  library:       many(userLibrary),
  saved:         many(userSaved),
}));

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  seller:    one(users, { fields: [prompts.sellerId], references: [users.id] }),
  category:  one(categories, { fields: [prompts.categoryId], references: [categories.id] }),
  aiTool:    one(aiTools, { fields: [prompts.aiToolId], references: [aiTools.id] }),
  purchases: many(purchases),
  reviews:   many(reviews),
  library:   many(userLibrary),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  buyer:  one(users, { fields: [purchases.buyerId],  references: [users.id], relationName: "buyer" }),
  seller: one(users, { fields: [purchases.sellerId], references: [users.id], relationName: "seller" }),
  prompt: one(prompts, { fields: [purchases.promptId], references: [prompts.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  prompt:   one(prompts,   { fields: [reviews.promptId],   references: [prompts.id] }),
  buyer:    one(users,     { fields: [reviews.buyerId],     references: [users.id] }),
  purchase: one(purchases, { fields: [reviews.purchaseId],  references: [purchases.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  prompts: many(prompts),
}));

export const aiToolsRelations = relations(aiTools, ({ many }) => ({
  prompts: many(prompts),
}));

export const userLibraryRelations = relations(userLibrary, ({ one }) => ({
  user:   one(users,   { fields: [userLibrary.userId],   references: [users.id] }),
  prompt: one(prompts, { fields: [userLibrary.promptId], references: [prompts.id] }),
}));

export const userSavedRelations = relations(userSaved, ({ one }) => ({
  user:   one(users,   { fields: [userSaved.userId],   references: [users.id] }),
  prompt: one(prompts, { fields: [userSaved.promptId], references: [prompts.id] }),
}));
