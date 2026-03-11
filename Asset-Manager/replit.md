# AI SEO Analyzer

## Overview
A full SaaS SEO platform with real website crawling, AI-powered analysis, and comprehensive SEO tooling. Includes: site crawling with keyword extraction, topical authority automation (clustering, content planning), SERP analysis, rank tracking, competitor analysis, backlink analysis, and Search Console data management.

## Tech Stack
- **Frontend**: React (Vite) + TailwindCSS + Shadcn UI
- **Backend**: Express.js (TypeScript)
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-4o for all AI features)
- **Crawling**: cheerio (HTML parsing), native fetch
- **NLP**: natural (TF-IDF keyword extraction)

## Architecture
- `shared/schema.ts` - Drizzle schema (14 tables)
- `server/db.ts` - Database connection
- `server/storage.ts` - DatabaseStorage class implementing IStorage interface
- `server/routes.ts` - All API endpoints
- `server/crawler.ts` - Website crawler (breadth-first, up to 50 pages, cheerio-based)
- `server/keyword-extractor.ts` - TF-IDF keyword extraction with n-grams
- `server/seo-scorer.ts` - SEO scoring engine (title, meta, headings, content, links, images)
- `server/seed.ts` - Seed data for demo projects
- `client/src/App.tsx` - Router with sidebar layout
- `client/src/pages/` - All page components
- `client/src/components/` - Reusable components

## Database Tables
### Core
- `projects` - id, name, domain, created_at
- `keywords` - id, project_id, keyword, created_at
- `clusters` - id, project_id, cluster_name, topic, created_at
- `cluster_keywords` - id, cluster_id, keyword_id
- `content_plans` - id, cluster_id, pillar_title, supporting_titles, meta_title, meta_description, search_intent, headings, internal_links

### Site Analysis
- `site_analyses` - id, project_id, url, status, domain_authority, seo_score, total_pages, total_keywords_found, issues_count, summary (jsonb)
- `crawled_pages` - id, site_analysis_id, url, title, meta_description, h1, h2s, word_count, internal_links, external_links, page_authority, keyword_density, seo_issues
- `extracted_keywords` - id, site_analysis_id, keyword, frequency, tfidf_score, is_long_tail, difficulty, search_volume, cluster

### SEO Tools
- `serp_analyses` - SERP feature analysis per keyword
- `rank_entries` - Keyword position tracking over time
- `competitors` / `competitor_analyses` - Competitor domain analysis
- `backlink_analyses` - Backlink profile analysis
- `search_console_data` - GSC data (import or AI-simulated)

## Pages (Sidebar Groups)
### Cluster Tools
Dashboard, Projects, Project Detail, Keywords, Clusters, Content Plans, SEO Report

### Site Analysis
Site Analyzer (crawl + analyze workflow), Site Audit (page-by-page audit)

### SEO Tools
SERP Analyzer, Rank Tracker, Competitors, Backlinks, Search Console

## Key Patterns
- `parseId()` for route param validation
- Lazy `getOpenAIClient()` per request
- Frontend query keys: `["/api/projects", projectId, "feature-name"]`
- `apiRequest(method, url, data)` for mutations
- Site analysis uses async background processing (returns 202, polls for completion)
- All AI features use gpt-4o with `response_format: { type: "json_object" }`
