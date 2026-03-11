import { sql } from "drizzle-orm";
import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const keywords = sqliteTable("keywords", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const clusters = sqliteTable("clusters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  clusterName: text("cluster_name").notNull(),
  topic: text("topic").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const clusterKeywords = sqliteTable("cluster_keywords", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clusterId: integer("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
  keywordId: integer("keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
});

export const contentPlans = sqliteTable("content_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clusterId: integer("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
  pillarTitle: text("pillar_title").notNull(),
  supportingTitles: text("supporting_titles", { mode: "json" }).$type<string[]>().notNull().default([]),
  metaTitle: text("meta_title").notNull(),
  metaDescription: text("meta_description").notNull(),
  searchIntent: text("search_intent").notNull(),
  headings: text("headings", { mode: "json" }).$type<string[]>().notNull().default([]),
  internalLinks: text("internal_links", { mode: "json" }).$type<{ from: string; to: string; anchor: string }[]>().notNull().default([]),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const serpAnalyses = sqliteTable("serp_analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  difficulty: real("difficulty"),
  searchVolume: integer("search_volume"),
  cpc: real("cpc"),
  intent: text("intent"),
  serpFeatures: text("serp_features", { mode: "json" }).$type<string[]>().default([]),
  topResults: text("top_results", { mode: "json" }).$type<{ position: number; title: string; url: string; description: string }[]>().default([]),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const rankEntries = sqliteTable("rank_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  position: integer("position"),
  url: text("url"),
  previousPosition: integer("previous_position"),
  checkedAt: text("checked_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const competitors = sqliteTable("competitors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const competitorAnalyses = sqliteTable("competitor_analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  competitorId: integer("competitor_id").notNull().references(() => competitors.id, { onDelete: "cascade" }),
  domainAuthority: real("domain_authority"),
  organicKeywords: integer("organic_keywords"),
  organicTraffic: integer("organic_traffic"),
  topKeywords: text("top_keywords", { mode: "json" }).$type<{ keyword: string; position: number; volume: number }[]>().default([]),
  contentGaps: text("content_gaps", { mode: "json" }).$type<string[]>().default([]),
  strengths: text("strengths", { mode: "json" }).$type<string[]>().default([]),
  weaknesses: text("weaknesses", { mode: "json" }).$type<string[]>().default([]),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const backlinkAnalyses = sqliteTable("backlink_analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  totalBacklinks: integer("total_backlinks"),
  referringDomains: integer("referring_domains"),
  domainAuthority: real("domain_authority"),
  topBacklinks: text("top_backlinks", { mode: "json" }).$type<{ source: string; target: string; anchor: string; authority: number; type: string }[]>().default([]),
  anchorDistribution: text("anchor_distribution", { mode: "json" }).$type<{ anchor: string; count: number; percentage: number }[]>().default([]),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const searchConsoleData = sqliteTable("search_console_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  ctr: real("ctr").default(0),
  position: real("position").default(0),
  page: text("page"),
  date: text("date"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const siteAnalyses = sqliteTable("site_analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  status: text("status").notNull().default("pending"),
  domainAuthority: real("domain_authority"),
  seoScore: real("seo_score"),
  totalPages: integer("total_pages").default(0),
  totalKeywordsFound: integer("total_keywords_found").default(0),
  issuesCount: integer("issues_count").default(0),
  summary: text("summary", { mode: "json" }).$type<{
    avgWordCount: number;
    avgPageAuthority: number;
    topIssues: string[];
    contentOpportunities: string[];
  }>(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const crawledPages = sqliteTable("crawled_pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteAnalysisId: integer("site_analysis_id").notNull().references(() => siteAnalyses.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  metaDescription: text("meta_description"),
  h1: text("h1"),
  h2s: text("h2s", { mode: "json" }).$type<string[]>().default([]),
  wordCount: integer("word_count").default(0),
  internalLinks: text("internal_links", { mode: "json" }).$type<string[]>().default([]),
  externalLinks: text("external_links", { mode: "json" }).$type<string[]>().default([]),
  pageAuthority: real("page_authority"),
  keywordDensity: real("keyword_density"),
  seoIssues: text("seo_issues", { mode: "json" }).$type<{ issue: string; severity: string; description: string }[]>().default([]),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const extractedKeywords = sqliteTable("extracted_keywords", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteAnalysisId: integer("site_analysis_id").notNull().references(() => siteAnalyses.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  frequency: integer("frequency").default(0),
  tfidfScore: real("tfidf_score").default(0),
  isLongTail: integer("is_long_tail").default(0),
  difficulty: real("difficulty"),
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
