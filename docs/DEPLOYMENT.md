# Deployment Strategy

## Stack
- Frontend + API: Vercel (Next.js)
- Database: Neon PostgreSQL (serverless, global)
- Search: Meilisearch Cloud
- Auth: Clerk
- Assets: Cloudflare R2 + CDN
- Payments: Stripe + Razorpay

## Phase 1: MVP (Week 1-2)
1. Deploy Next.js to Vercel
2. Set up Neon PostgreSQL + run migrations
3. Configure Clerk auth
4. Connect Stripe (test mode)
5. Set up Meilisearch index
6. Deploy with all env vars

## Phase 2: SEO (Week 3-4)
1. Submit sitemap to Google Search Console
2. Set up Google Analytics 4
3. Enable ISR for all marketplace pages
4. Configure Cloudflare CDN in front of Vercel
5. Run Lighthouse — target 95+ score

## Phase 3: Scale (Month 2+)
1. Enable Vercel Edge Functions for search
2. Add Redis cache (Upstash) for hot prompts
3. Set up Razorpay for India
4. Launch seller payouts via Stripe Connect

## Performance Targets
- LCP < 1.5s (ISR + CDN)
- FID < 50ms (minimal client JS)
- CLS < 0.05 (stable layouts)
- Lighthouse Performance: 95+

## SEO Launch Checklist
- [ ] sitemap.xml submitted to GSC
- [ ] robots.txt live
- [ ] Schema.org on every prompt page
- [ ] FAQ schema on programmatic pages
- [ ] Canonical URLs set
- [ ] OG images generated
- [ ] Internal linking structure live
- [ ] Core Web Vitals green

## Programmatic SEO Scale Plan
Launch: 1,850 pages (tools × use-cases + jobs + free categories)
Month 3: Add comparison pages (/compare/promptmarket-vs-promptbase)
Month 6: Add localized pages for IN, GB, CA markets
Year 1: Target 50,000+ indexed pages
