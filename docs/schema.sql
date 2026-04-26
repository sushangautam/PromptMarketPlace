-- PromptMarket Database Schema
-- PostgreSQL 15+

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy search
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  username      TEXT UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  role          TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller','admin')),
  stripe_customer_id   TEXT,
  razorpay_customer_id TEXT,
  stripe_account_id    TEXT, -- for seller payouts
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  parent_id   UUID REFERENCES categories(id),
  sort_order  INT DEFAULT 0,
  prompt_count INT DEFAULT 0, -- denormalized for performance
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AI TOOLS ────────────────────────────────────────────────────────────────

CREATE TABLE ai_tools (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,         -- "ChatGPT", "Midjourney"
  slug        TEXT UNIQUE NOT NULL,  -- "chatgpt", "midjourney"
  logo_url    TEXT,
  description TEXT,
  website_url TEXT,
  prompt_count INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROMPTS ─────────────────────────────────────────────────────────────────

CREATE TABLE prompts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT NOT NULL,
  prompt_text     TEXT NOT NULL,          -- full prompt (buyers only after purchase)
  preview_text    TEXT,                   -- teaser visible to all
  example_output  TEXT,                   -- sample output text
  example_image_url TEXT,                 -- sample output image
  category_id     UUID REFERENCES categories(id),
  ai_tool_id      UUID REFERENCES ai_tools(id),
  tags            TEXT[] DEFAULT '{}',
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency        TEXT DEFAULT 'USD',
  is_free         BOOLEAN GENERATED ALWAYS AS (price = 0) STORED,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending','active','rejected','archived')),
  is_featured     BOOLEAN DEFAULT false,

  -- SEO fields
  meta_title      TEXT,
  meta_description TEXT,
  faqs            JSONB DEFAULT '[]',     -- [{q, a}, ...]

  -- Stats (denormalized)
  view_count      INT DEFAULT 0,
  purchase_count  INT DEFAULT 0,
  rating_avg      NUMERIC(3,2) DEFAULT 0,
  rating_count    INT DEFAULT 0,

  -- Full-text search
  search_vector   TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
  ) STORED,

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompts_search ON prompts USING GIN(search_vector);
CREATE INDEX idx_prompts_category ON prompts(category_id);
CREATE INDEX idx_prompts_ai_tool ON prompts(ai_tool_id);
CREATE INDEX idx_prompts_seller ON prompts(seller_id);
CREATE INDEX idx_prompts_status ON prompts(status);
CREATE INDEX idx_prompts_price ON prompts(price);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX idx_prompts_created ON prompts(created_at DESC);
CREATE INDEX idx_prompts_rating ON prompts(rating_avg DESC);

-- ─── PROMPT BUNDLES ──────────────────────────────────────────────────────────

CREATE TABLE bundles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id   UUID NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bundle_prompts (
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, prompt_id)
);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────

CREATE TABLE subscription_plans (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,          -- "Starter", "Pro", "Enterprise"
  slug         TEXT UNIQUE NOT NULL,
  price_monthly NUMERIC(10,2),
  price_yearly  NUMERIC(10,2),
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly  TEXT,
  features     JSONB DEFAULT '{}',
  prompt_limit INT,                    -- NULL = unlimited
  is_active    BOOLEAN DEFAULT true
);

CREATE TABLE user_subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id),
  plan_id           UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_sub_id     TEXT,
  status            TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PURCHASES ───────────────────────────────────────────────────────────────

CREATE TABLE purchases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  prompt_id       UUID REFERENCES prompts(id),
  bundle_id       UUID REFERENCES bundles(id),
  amount          NUMERIC(10,2) NOT NULL,
  currency        TEXT DEFAULT 'USD',
  platform_fee    NUMERIC(10,2),       -- our commission
  seller_payout   NUMERIC(10,2),
  payment_provider TEXT CHECK (payment_provider IN ('stripe','razorpay')),
  payment_intent_id TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','refunded','failed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_buyer ON purchases(buyer_id);
CREATE INDEX idx_purchases_prompt ON purchases(prompt_id);

-- ─── REVIEWS ─────────────────────────────────────────────────────────────────

CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id   UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  buyer_id    UUID NOT NULL REFERENCES users(id),
  purchase_id UUID NOT NULL REFERENCES purchases(id),
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, buyer_id)
);

-- ─── LIBRARY (purchased / saved) ────────────────────────────────────────────

CREATE TABLE user_library (
  user_id    UUID REFERENCES users(id),
  prompt_id  UUID REFERENCES prompts(id),
  source     TEXT DEFAULT 'purchase' CHECK (source IN ('purchase','free','subscription')),
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, prompt_id)
);

CREATE TABLE user_saved (
  user_id   UUID REFERENCES users(id),
  prompt_id UUID REFERENCES prompts(id),
  saved_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, prompt_id)
);

-- ─── SELLER PAYOUTS ──────────────────────────────────────────────────────────

CREATE TABLE payouts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id       UUID NOT NULL REFERENCES users(id),
  amount          NUMERIC(10,2) NOT NULL,
  currency        TEXT DEFAULT 'USD',
  provider        TEXT,
  provider_payout_id TEXT,
  status          TEXT DEFAULT 'pending',
  initiated_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROGRAMMATIC SEO PAGES ──────────────────────────────────────────────────

CREATE TABLE seo_pages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_type   TEXT NOT NULL,  -- 'best-tool-prompts', 'prompts-for-job', etc.
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  h1          TEXT NOT NULL,
  description TEXT,
  intro_html  TEXT,
  faqs        JSONB DEFAULT '[]',
  ai_tool_id  UUID REFERENCES ai_tools(id),
  category_id UUID REFERENCES categories(id),
  keywords    TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BLOG ────────────────────────────────────────────────────────────────────

CREATE TABLE blog_posts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id     UUID REFERENCES users(id),
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  excerpt       TEXT,
  content       TEXT NOT NULL,
  cover_image   TEXT,
  tags          TEXT[],
  meta_title    TEXT,
  meta_description TEXT,
  is_published  BOOLEAN DEFAULT false,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ANALYTICS EVENTS ────────────────────────────────────────────────────────

CREATE TABLE analytics_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type  TEXT NOT NULL,  -- 'view','click','purchase','search'
  prompt_id   UUID REFERENCES prompts(id),
  user_id     UUID REFERENCES users(id),
  metadata    JSONB DEFAULT '{}',
  ip_hash     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_prompt ON analytics_events(prompt_id, created_at DESC);
CREATE INDEX idx_analytics_type ON analytics_events(event_type, created_at DESC);
