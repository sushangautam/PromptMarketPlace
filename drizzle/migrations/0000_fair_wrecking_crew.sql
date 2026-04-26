CREATE TYPE "public"."payment_provider" AS ENUM('stripe', 'razorpay');--> statement-breakpoint
CREATE TYPE "public"."prompt_status" AS ENUM('draft', 'pending', 'active', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('pending', 'completed', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('buyer', 'seller', 'admin');--> statement-breakpoint
CREATE TABLE "ai_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"description" text,
	"website_url" text,
	"prompt_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ai_tools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"cover_image" text,
	"tags" text[],
	"meta_title" text,
	"meta_description" text,
	"status" text DEFAULT 'draft',
	"is_published" boolean DEFAULT false,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0,
	"prompt_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"prompt_text" text NOT NULL,
	"preview_text" text,
	"example_output" text,
	"example_image_url" text,
	"category_id" uuid,
	"ai_tool_id" uuid,
	"tags" text[] DEFAULT '{}'::text[],
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'USD',
	"status" "prompt_status" DEFAULT 'draft',
	"is_featured" boolean DEFAULT false,
	"meta_title" text,
	"meta_description" text,
	"faqs" jsonb DEFAULT '[]'::jsonb,
	"view_count" integer DEFAULT 0,
	"purchase_count" integer DEFAULT 0,
	"rating_avg" numeric(3, 2) DEFAULT '0',
	"rating_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "prompts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid,
	"prompt_id" uuid,
	"bundle_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"platform_fee" numeric(10, 2),
	"seller_payout" numeric(10, 2),
	"payment_provider" "payment_provider",
	"payment_intent_id" text,
	"status" "purchase_status" DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"purchase_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_type" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"h1" text NOT NULL,
	"description" text,
	"intro_html" text,
	"faqs" jsonb DEFAULT '[]'::jsonb,
	"ai_tool_id" uuid,
	"category_id" uuid,
	"keywords" text[],
	"is_published" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "seo_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_library" (
	"user_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"source" text DEFAULT 'purchase',
	"added_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_saved" (
	"user_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"username" text,
	"full_name" text,
	"avatar_url" text,
	"bio" text,
	"role" "user_role" DEFAULT 'buyer' NOT NULL,
	"stripe_customer_id" text,
	"razorpay_customer_id" text,
	"stripe_account_id" text,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_ai_tool_id_ai_tools_id_fk" FOREIGN KEY ("ai_tool_id") REFERENCES "public"."ai_tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_pages" ADD CONSTRAINT "seo_pages_ai_tool_id_ai_tools_id_fk" FOREIGN KEY ("ai_tool_id") REFERENCES "public"."ai_tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_pages" ADD CONSTRAINT "seo_pages_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_library" ADD CONSTRAINT "user_library_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_library" ADD CONSTRAINT "user_library_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved" ADD CONSTRAINT "user_saved_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved" ADD CONSTRAINT "user_saved_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_prompts_category" ON "prompts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_prompts_tool" ON "prompts" USING btree ("ai_tool_id");--> statement-breakpoint
CREATE INDEX "idx_prompts_seller" ON "prompts" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_prompts_status" ON "prompts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_prompts_rating" ON "prompts" USING btree ("rating_avg");--> statement-breakpoint
CREATE INDEX "idx_prompts_created" ON "prompts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_purchases_buyer" ON "purchases" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_purchases_seller" ON "purchases" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_purchases_prompt" ON "purchases" USING btree ("prompt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_review" ON "reviews" USING btree ("prompt_id","buyer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_library_pk" ON "user_library" USING btree ("user_id","prompt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_saved_pk" ON "user_saved" USING btree ("user_id","prompt_id");