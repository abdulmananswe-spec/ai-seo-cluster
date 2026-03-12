import { sql } from "drizzle-orm";
import { pgTable, serial, integer, text, doublePrecision, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const keywords = pgTable("keywords", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clusters = pgTable("clusters", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  clusterName: text("cluster_name").notNull(),
  topic: text("topic").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clusterKeywords = pgTable("cluster_keywords", {
  id: serial("id").primaryKey(),
  clusterId: integer("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
  keywordId: integer("keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
});

export const contentPlans = pgTable("content_plans", {
  id: serial("id").primaryKey(),
  clusterId: integer("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
  pillarTitle: text("pillar_title").notNull(),
  supportingTitles: jsonb("supporting_titles").$type<string[]>().notNull().default([]),
  metaTitle: text("meta_title").notNull(),
  metaDescription: text("meta_description").notNull(),
  searchIntent: text("search_intent").notNull(),
  headings: jsonb("headings").$type<string[]>().notNull().default([]),
  internalLinks: jsonb("internal_links").$type<{ from: string; to: string; anchor: string }[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serpAnalyses = pgTable("serp_analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  difficulty: doublePrecision("difficulty"),
  searchVolume: integer("search_volume"),
  cpc: doublePrecision("cpc"),
  intent: text("intent"),
  serpFeatures: jsonb("serp_features").$type<string[]>().default([]),
  topResults: jsonb("top_results").$type<{ position: number; title: string; url: string; description: string }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rankEntries = pgTable("rank_entries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  position: integer("position"),
  url: text("url"),
  previousPosition: integer("previous_position"),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

export const competitors = pgTable("competitors", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const competitorAnalyses = pgTable("competitor_analyses", {
  id: serial("id").primaryKey(),
  competitorId: integer("competitor_id").notNull().references(() => competitors.id, { onDelete: "cascade" }),
  domainAuthority: doublePrecision("domain_authority"),
  organicKeywords: integer("organic_keywords"),
  organicTraffic: integer("organic_traffic"),
  topKeywords: jsonb("top_keywords").$type<{ keyword: string; position: number; volume: number }[]>().default([]),
  contentGaps: jsonb("content_gaps").$type<string[]>().default([]),
  strengths: jsonb("strengths").$type<string[]>().default([]),
  weaknesses: jsonb("weaknesses").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const backlinkAnalyses = pgTable("backlink_analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  totalBacklinks: integer("total_backlinks"),
  referringDomains: integer("referring_domains"),
  domainAuthority: doublePrecision("domain_authority"),
  topBacklinks: jsonb("top_backlinks").$type<{ source: string; target: string; anchor: string; authority: number; type: string }[]>().default([]),
  anchorDistribution: jsonb("anchor_distribution").$type<{ anchor: string; count: number; percentage: number }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const searchConsoleData = pgTable("search_console_data", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  ctr: doublePrecision("ctr").default(0),
  position: doublePrecision("position").default(0),
  page: text("page"),
  date: text("date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const siteAnalyses = pgTable("site_analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  status: text("status").notNull().default("pending"),
  domainAuthority: doublePrecision("domain_authority"),
  seoScore: doublePrecision("seo_score"),
  totalPages: integer("total_pages").default(0),
  totalKeywordsFound: integer("total_keywords_found").default(0),
  issuesCount: integer("issues_count").default(0),
  summary: jsonb("summary").$type<{
    avgWordCount: number;
    avgPageAuthority: number;
    topIssues: string[];
    contentOpportunities: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crawledPages = pgTable("crawled_pages", {
  id: serial("id").primaryKey(),
  siteAnalysisId: integer("site_analysis_id").notNull().references(() => siteAnalyses.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  metaDescription: text("meta_description"),
  h1: text("h1"),
  h2s: jsonb("h2s").$type<string[]>().default([]),
  wordCount: integer("word_count").default(0),
  internalLinks: jsonb("internal_links").$type<string[]>().default([]),
  externalLinks: jsonb("external_links").$type<string[]>().default([]),
  pageAuthority: doublePrecision("page_authority"),
  keywordDensity: doublePrecision("keyword_density"),
  seoIssues: jsonb("seo_issues").$type<{ issue: string; severity: string; description: string }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const extractedKeywords = pgTable("extracted_keywords", {
  id: serial("id").primaryKey(),
  siteAnalysisId: integer("site_analysis_id").notNull().references(() => siteAnalyses.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  frequency: integer("frequency").default(0),
  tfidfScore: doublePrecision("tfidf_score").default(0),
  isLongTail: integer("is_long_tail").default(0),
  difficulty: doublePrecision("difficulty"),
  searchVolume: integer("search_volume"),
  cluster: text("cluster"),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertKeywordSchema = createInsertSchema(keywords).omit({ id: true, createdAt: true });
export const insertClusterSchema = createInsertSchema(clusters).omit({ id: true, createdAt: true });
export const insertClusterKeywordSchema = createInsertSchema(clusterKeywords).omit({ id: true });
export const insertContentPlanSchema = createInsertSchema(contentPlans).omit({ id: true, createdAt: true });
export const insertSerpAnalysisSchema = createInsertSchema(serpAnalyses).omit({ id: true, createdAt: true });
export const insertRankEntrySchema = createInsertSchema(rankEntries).omit({ id: true, checkedAt: true });
export const insertCompetitorSchema = createInsertSchema(competitors).omit({ id: true, createdAt: true });
export const insertCompetitorAnalysisSchema = createInsertSchema(competitorAnalyses).omit({ id: true, createdAt: true });
export const insertBacklinkAnalysisSchema = createInsertSchema(backlinkAnalyses).omit({ id: true, createdAt: true });
export const insertSearchConsoleDataSchema = createInsertSchema(searchConsoleData).omit({ id: true, createdAt: true });
export const insertSiteAnalysisSchema = createInsertSchema(siteAnalyses).omit({ id: true, createdAt: true });
export const insertCrawledPageSchema = createInsertSchema(crawledPages).omit({ id: true, createdAt: true });
export const insertExtractedKeywordSchema = createInsertSchema(extractedKeywords).omit({ id: true });

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Cluster = typeof clusters.$inferSelect;
export type InsertCluster = z.infer<typeof insertClusterSchema>;
export type ClusterKeyword = typeof clusterKeywords.$inferSelect;
export type InsertClusterKeyword = z.infer<typeof insertClusterKeywordSchema>;
export type ContentPlan = typeof contentPlans.$inferSelect;
export type InsertContentPlan = z.infer<typeof insertContentPlanSchema>;
export type SerpAnalysis = typeof serpAnalyses.$inferSelect;
export type InsertSerpAnalysis = z.infer<typeof insertSerpAnalysisSchema>;
export type RankEntry = typeof rankEntries.$inferSelect;
export type InsertRankEntry = z.infer<typeof insertRankEntrySchema>;
export type Competitor = typeof competitors.$inferSelect;
export type InsertCompetitor = z.infer<typeof insertCompetitorSchema>;
export type CompetitorAnalysis = typeof competitorAnalyses.$inferSelect;
export type InsertCompetitorAnalysis = z.infer<typeof insertCompetitorAnalysisSchema>;
export type BacklinkAnalysis = typeof backlinkAnalyses.$inferSelect;
export type InsertBacklinkAnalysis = z.infer<typeof insertBacklinkAnalysisSchema>;
export type SearchConsoleData = typeof searchConsoleData.$inferSelect;
export type InsertSearchConsoleData = z.infer<typeof insertSearchConsoleDataSchema>;
export type SiteAnalysis = typeof siteAnalyses.$inferSelect;
export type InsertSiteAnalysis = z.infer<typeof insertSiteAnalysisSchema>;
export type CrawledPage = typeof crawledPages.$inferSelect;
export type InsertCrawledPage = z.infer<typeof insertCrawledPageSchema>;
export type ExtractedKeyword = typeof extractedKeywords.$inferSelect;
export type InsertExtractedKeyword = z.infer<typeof insertExtractedKeywordSchema>;
