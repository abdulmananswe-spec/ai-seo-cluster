CREATE TABLE "backlink_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"domain" text NOT NULL,
	"total_backlinks" integer,
	"referring_domains" integer,
	"domain_authority" double precision,
	"top_backlinks" jsonb DEFAULT '[]'::jsonb,
	"anchor_distribution" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cluster_keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"cluster_id" integer NOT NULL,
	"keyword_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clusters" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"cluster_name" text NOT NULL,
	"topic" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitor_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"competitor_id" integer NOT NULL,
	"domain_authority" double precision,
	"organic_keywords" integer,
	"organic_traffic" integer,
	"top_keywords" jsonb DEFAULT '[]'::jsonb,
	"content_gaps" jsonb DEFAULT '[]'::jsonb,
	"strengths" jsonb DEFAULT '[]'::jsonb,
	"weaknesses" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"domain" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"cluster_id" integer NOT NULL,
	"pillar_title" text NOT NULL,
	"supporting_titles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"meta_title" text NOT NULL,
	"meta_description" text NOT NULL,
	"search_intent" text NOT NULL,
	"headings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"internal_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crawled_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_analysis_id" integer NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"meta_description" text,
	"h1" text,
	"h2s" jsonb DEFAULT '[]'::jsonb,
	"word_count" integer DEFAULT 0,
	"internal_links" jsonb DEFAULT '[]'::jsonb,
	"external_links" jsonb DEFAULT '[]'::jsonb,
	"page_authority" double precision,
	"keyword_density" double precision,
	"seo_issues" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extracted_keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_analysis_id" integer NOT NULL,
	"keyword" text NOT NULL,
	"frequency" integer DEFAULT 0,
	"tfidf_score" double precision DEFAULT 0,
	"is_long_tail" integer DEFAULT 0,
	"difficulty" double precision,
	"search_volume" integer,
	"cluster" text
);
--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"keyword" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rank_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"keyword" text NOT NULL,
	"position" integer,
	"url" text,
	"previous_position" integer,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_console_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"query" text NOT NULL,
	"clicks" integer DEFAULT 0,
	"impressions" integer DEFAULT 0,
	"ctr" double precision DEFAULT 0,
	"position" double precision DEFAULT 0,
	"page" text,
	"date" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serp_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"keyword" text NOT NULL,
	"difficulty" double precision,
	"search_volume" integer,
	"cpc" double precision,
	"intent" text,
	"serp_features" jsonb DEFAULT '[]'::jsonb,
	"top_results" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"domain_authority" double precision,
	"seo_score" double precision,
	"total_pages" integer DEFAULT 0,
	"total_keywords_found" integer DEFAULT 0,
	"issues_count" integer DEFAULT 0,
	"summary" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "backlink_analyses" ADD CONSTRAINT "backlink_analyses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cluster_keywords" ADD CONSTRAINT "cluster_keywords_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cluster_keywords" ADD CONSTRAINT "cluster_keywords_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clusters" ADD CONSTRAINT "clusters_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_analyses" ADD CONSTRAINT "competitor_analyses_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_plans" ADD CONSTRAINT "content_plans_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawled_pages" ADD CONSTRAINT "crawled_pages_site_analysis_id_site_analyses_id_fk" FOREIGN KEY ("site_analysis_id") REFERENCES "public"."site_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracted_keywords" ADD CONSTRAINT "extracted_keywords_site_analysis_id_site_analyses_id_fk" FOREIGN KEY ("site_analysis_id") REFERENCES "public"."site_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_entries" ADD CONSTRAINT "rank_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_console_data" ADD CONSTRAINT "search_console_data_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serp_analyses" ADD CONSTRAINT "serp_analyses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_analyses" ADD CONSTRAINT "site_analyses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;