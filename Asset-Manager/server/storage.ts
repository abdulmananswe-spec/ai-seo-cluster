import { db } from "./db";
import { eq, desc, count, and } from "drizzle-orm";
import {
  projects, keywords, clusters, clusterKeywords, contentPlans,
  serpAnalyses, rankEntries, competitors, competitorAnalyses, backlinkAnalyses, searchConsoleData,
  siteAnalyses, crawledPages, extractedKeywords,
  type Project, type InsertProject,
  type Keyword, type InsertKeyword,
  type Cluster, type InsertCluster,
  type ClusterKeyword, type InsertClusterKeyword,
  type ContentPlan, type InsertContentPlan,
  type SerpAnalysis, type InsertSerpAnalysis,
  type RankEntry, type InsertRankEntry,
  type Competitor, type InsertCompetitor,
  type CompetitorAnalysis, type InsertCompetitorAnalysis,
  type BacklinkAnalysis, type InsertBacklinkAnalysis,
  type SearchConsoleData, type InsertSearchConsoleData,
  type SiteAnalysis, type InsertSiteAnalysis,
  type CrawledPage, type InsertCrawledPage,
  type ExtractedKeyword, type InsertExtractedKeyword,
} from "@shared/schema";

export interface IStorage {
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  getKeywordsByProject(projectId: number): Promise<Keyword[]>;
  createKeyword(data: InsertKeyword): Promise<Keyword>;
  createKeywords(data: InsertKeyword[]): Promise<Keyword[]>;
  deleteKeyword(id: number): Promise<void>;
  getKeywordCount(projectId: number): Promise<number>;

  getClustersByProject(projectId: number): Promise<Cluster[]>;
  getCluster(id: number): Promise<Cluster | undefined>;
  createCluster(data: InsertCluster): Promise<Cluster>;
  deleteClustersByProject(projectId: number): Promise<void>;
  getClusterCount(projectId: number): Promise<number>;

  getClusterKeywords(clusterId: number): Promise<(ClusterKeyword & { keyword: string })[]>;
  createClusterKeyword(data: InsertClusterKeyword): Promise<ClusterKeyword>;

  getContentPlanByCluster(clusterId: number): Promise<ContentPlan | undefined>;
  getContentPlansByProject(projectId: number): Promise<(ContentPlan & { clusterName: string })[]>;
  createContentPlan(data: InsertContentPlan): Promise<ContentPlan>;
  deleteContentPlansByCluster(clusterId: number): Promise<void>;
  getContentPlanCount(projectId: number): Promise<number>;

  getSerpAnalysesByProject(projectId: number): Promise<SerpAnalysis[]>;
  createSerpAnalysis(data: InsertSerpAnalysis): Promise<SerpAnalysis>;
  deleteSerpAnalysesByProject(projectId: number): Promise<void>;

  getRankEntriesByProject(projectId: number): Promise<RankEntry[]>;
  createRankEntry(data: InsertRankEntry): Promise<RankEntry>;
  createRankEntries(data: InsertRankEntry[]): Promise<RankEntry[]>;

  getCompetitorsByProject(projectId: number): Promise<Competitor[]>;
  getCompetitor(id: number): Promise<Competitor | undefined>;
  createCompetitor(data: InsertCompetitor): Promise<Competitor>;
  deleteCompetitor(id: number): Promise<void>;

  getCompetitorAnalysis(competitorId: number): Promise<CompetitorAnalysis | undefined>;
  createCompetitorAnalysis(data: InsertCompetitorAnalysis): Promise<CompetitorAnalysis>;
  deleteCompetitorAnalysis(competitorId: number): Promise<void>;

  getBacklinkAnalysesByProject(projectId: number): Promise<BacklinkAnalysis[]>;
  createBacklinkAnalysis(data: InsertBacklinkAnalysis): Promise<BacklinkAnalysis>;
  deleteBacklinkAnalysesByProject(projectId: number): Promise<void>;

  getSearchConsoleDataByProject(projectId: number): Promise<SearchConsoleData[]>;
  createSearchConsoleData(data: InsertSearchConsoleData): Promise<SearchConsoleData>;
  createSearchConsoleDataBatch(data: InsertSearchConsoleData[]): Promise<SearchConsoleData[]>;
  deleteSearchConsoleDataByProject(projectId: number): Promise<void>;

  getSiteAnalysesByProject(projectId: number): Promise<SiteAnalysis[]>;
  getSiteAnalysis(id: number): Promise<SiteAnalysis | undefined>;
  createSiteAnalysis(data: InsertSiteAnalysis): Promise<SiteAnalysis>;
  updateSiteAnalysis(id: number, data: Partial<InsertSiteAnalysis>): Promise<SiteAnalysis>;

  getCrawledPages(siteAnalysisId: number): Promise<CrawledPage[]>;
  createCrawledPages(data: InsertCrawledPage[]): Promise<CrawledPage[]>;

  getExtractedKeywords(siteAnalysisId: number): Promise<ExtractedKeyword[]>;
  createExtractedKeywords(data: InsertExtractedKeyword[]): Promise<ExtractedKeyword[]>;
}

export class DatabaseStorage implements IStorage {
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(data: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getKeywordsByProject(projectId: number): Promise<Keyword[]> {
    return db.select().from(keywords).where(eq(keywords.projectId, projectId)).orderBy(desc(keywords.createdAt));
  }

  async createKeyword(data: InsertKeyword): Promise<Keyword> {
    const [keyword] = await db.insert(keywords).values(data).returning();
    return keyword;
  }

  async createKeywords(data: InsertKeyword[]): Promise<Keyword[]> {
    if (data.length === 0) return [];
    return db.insert(keywords).values(data).returning();
  }

  async deleteKeyword(id: number): Promise<void> {
    await db.delete(keywords).where(eq(keywords.id, id));
  }

  async getKeywordCount(projectId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(keywords).where(eq(keywords.projectId, projectId));
    return result?.count ?? 0;
  }

  async getClustersByProject(projectId: number): Promise<Cluster[]> {
    return db.select().from(clusters).where(eq(clusters.projectId, projectId)).orderBy(desc(clusters.createdAt));
  }

  async getCluster(id: number): Promise<Cluster | undefined> {
    const [cluster] = await db.select().from(clusters).where(eq(clusters.id, id));
    return cluster;
  }

  async createCluster(data: InsertCluster): Promise<Cluster> {
    const [cluster] = await db.insert(clusters).values(data).returning();
    return cluster;
  }

  async deleteClustersByProject(projectId: number): Promise<void> {
    await db.delete(clusters).where(eq(clusters.projectId, projectId));
  }

  async getClusterCount(projectId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(clusters).where(eq(clusters.projectId, projectId));
    return result?.count ?? 0;
  }

  async getClusterKeywords(clusterId: number): Promise<(ClusterKeyword & { keyword: string })[]> {
    return db
      .select({ id: clusterKeywords.id, clusterId: clusterKeywords.clusterId, keywordId: clusterKeywords.keywordId, keyword: keywords.keyword })
      .from(clusterKeywords)
      .innerJoin(keywords, eq(clusterKeywords.keywordId, keywords.id))
      .where(eq(clusterKeywords.clusterId, clusterId));
  }

  async createClusterKeyword(data: InsertClusterKeyword): Promise<ClusterKeyword> {
    const [ck] = await db.insert(clusterKeywords).values(data).returning();
    return ck;
  }

  async getContentPlanByCluster(clusterId: number): Promise<ContentPlan | undefined> {
    const [plan] = await db.select().from(contentPlans).where(eq(contentPlans.clusterId, clusterId));
    return plan;
  }

  async getContentPlansByProject(projectId: number): Promise<(ContentPlan & { clusterName: string })[]> {
    return db
      .select({
        id: contentPlans.id, clusterId: contentPlans.clusterId, pillarTitle: contentPlans.pillarTitle,
        supportingTitles: contentPlans.supportingTitles, metaTitle: contentPlans.metaTitle,
        metaDescription: contentPlans.metaDescription, searchIntent: contentPlans.searchIntent,
        headings: contentPlans.headings, internalLinks: contentPlans.internalLinks,
        createdAt: contentPlans.createdAt, clusterName: clusters.clusterName,
      })
      .from(contentPlans)
      .innerJoin(clusters, eq(contentPlans.clusterId, clusters.id))
      .where(eq(clusters.projectId, projectId))
      .orderBy(desc(contentPlans.createdAt));
  }

  async createContentPlan(data: InsertContentPlan): Promise<ContentPlan> {
    const [plan] = await db.insert(contentPlans).values(data).returning();
    return plan;
  }

  async deleteContentPlansByCluster(clusterId: number): Promise<void> {
    await db.delete(contentPlans).where(eq(contentPlans.clusterId, clusterId));
  }

  async getContentPlanCount(projectId: number): Promise<number> {
    const results = await db
      .select({ count: count() })
      .from(contentPlans)
      .innerJoin(clusters, eq(contentPlans.clusterId, clusters.id))
      .where(eq(clusters.projectId, projectId));
    return results[0]?.count ?? 0;
  }

  async getSerpAnalysesByProject(projectId: number): Promise<SerpAnalysis[]> {
    return db.select().from(serpAnalyses).where(eq(serpAnalyses.projectId, projectId)).orderBy(desc(serpAnalyses.createdAt));
  }

  async createSerpAnalysis(data: InsertSerpAnalysis): Promise<SerpAnalysis> {
    const [sa] = await db.insert(serpAnalyses).values(data).returning();
    return sa;
  }

  async deleteSerpAnalysesByProject(projectId: number): Promise<void> {
    await db.delete(serpAnalyses).where(eq(serpAnalyses.projectId, projectId));
  }

  async getRankEntriesByProject(projectId: number): Promise<RankEntry[]> {
    return db.select().from(rankEntries).where(eq(rankEntries.projectId, projectId)).orderBy(desc(rankEntries.checkedAt));
  }

  async createRankEntry(data: InsertRankEntry): Promise<RankEntry> {
    const [re] = await db.insert(rankEntries).values(data).returning();
    return re;
  }

  async createRankEntries(data: InsertRankEntry[]): Promise<RankEntry[]> {
    if (data.length === 0) return [];
    return db.insert(rankEntries).values(data).returning();
  }

  async getCompetitorsByProject(projectId: number): Promise<Competitor[]> {
    return db.select().from(competitors).where(eq(competitors.projectId, projectId)).orderBy(desc(competitors.createdAt));
  }

  async getCompetitor(id: number): Promise<Competitor | undefined> {
    const [comp] = await db.select().from(competitors).where(eq(competitors.id, id));
    return comp;
  }

  async createCompetitor(data: InsertCompetitor): Promise<Competitor> {
    const [comp] = await db.insert(competitors).values(data).returning();
    return comp;
  }

  async deleteCompetitor(id: number): Promise<void> {
    await db.delete(competitorAnalyses).where(eq(competitorAnalyses.competitorId, id));
    await db.delete(competitors).where(eq(competitors.id, id));
  }

  async getCompetitorAnalysis(competitorId: number): Promise<CompetitorAnalysis | undefined> {
    const [ca] = await db.select().from(competitorAnalyses).where(eq(competitorAnalyses.competitorId, competitorId));
    return ca;
  }

  async createCompetitorAnalysis(data: InsertCompetitorAnalysis): Promise<CompetitorAnalysis> {
    const [ca] = await db.insert(competitorAnalyses).values(data).returning();
    return ca;
  }

  async deleteCompetitorAnalysis(competitorId: number): Promise<void> {
    await db.delete(competitorAnalyses).where(eq(competitorAnalyses.competitorId, competitorId));
  }

  async getBacklinkAnalysesByProject(projectId: number): Promise<BacklinkAnalysis[]> {
    return db.select().from(backlinkAnalyses).where(eq(backlinkAnalyses.projectId, projectId)).orderBy(desc(backlinkAnalyses.createdAt));
  }

  async createBacklinkAnalysis(data: InsertBacklinkAnalysis): Promise<BacklinkAnalysis> {
    const [ba] = await db.insert(backlinkAnalyses).values(data).returning();
    return ba;
  }

  async deleteBacklinkAnalysesByProject(projectId: number): Promise<void> {
    await db.delete(backlinkAnalyses).where(eq(backlinkAnalyses.projectId, projectId));
  }

  async getSearchConsoleDataByProject(projectId: number): Promise<SearchConsoleData[]> {
    return db.select().from(searchConsoleData).where(eq(searchConsoleData.projectId, projectId)).orderBy(desc(searchConsoleData.createdAt));
  }

  async createSearchConsoleData(data: InsertSearchConsoleData): Promise<SearchConsoleData> {
    const [scd] = await db.insert(searchConsoleData).values(data).returning();
    return scd;
  }

  async createSearchConsoleDataBatch(data: InsertSearchConsoleData[]): Promise<SearchConsoleData[]> {
    if (data.length === 0) return [];
    return db.insert(searchConsoleData).values(data).returning();
  }

  async deleteSearchConsoleDataByProject(projectId: number): Promise<void> {
    await db.delete(searchConsoleData).where(eq(searchConsoleData.projectId, projectId));
  }

  async getSiteAnalysesByProject(projectId: number): Promise<SiteAnalysis[]> {
    return db.select().from(siteAnalyses).where(eq(siteAnalyses.projectId, projectId)).orderBy(desc(siteAnalyses.createdAt));
  }

  async getSiteAnalysis(id: number): Promise<SiteAnalysis | undefined> {
    const [sa] = await db.select().from(siteAnalyses).where(eq(siteAnalyses.id, id));
    return sa;
  }

  async createSiteAnalysis(data: InsertSiteAnalysis): Promise<SiteAnalysis> {
    const [sa] = await db.insert(siteAnalyses).values(data).returning();
    return sa;
  }

  async updateSiteAnalysis(id: number, data: Partial<InsertSiteAnalysis>): Promise<SiteAnalysis> {
    const [sa] = await db.update(siteAnalyses).set(data).where(eq(siteAnalyses.id, id)).returning();
    return sa;
  }

  async getCrawledPages(siteAnalysisId: number): Promise<CrawledPage[]> {
    return db.select().from(crawledPages).where(eq(crawledPages.siteAnalysisId, siteAnalysisId));
  }

  async createCrawledPages(data: InsertCrawledPage[]): Promise<CrawledPage[]> {
    if (data.length === 0) return [];
    return db.insert(crawledPages).values(data).returning();
  }

  async getExtractedKeywords(siteAnalysisId: number): Promise<ExtractedKeyword[]> {
    return db.select().from(extractedKeywords).where(eq(extractedKeywords.siteAnalysisId, siteAnalysisId)).orderBy(desc(extractedKeywords.tfidfScore));
  }

  async createExtractedKeywords(data: InsertExtractedKeyword[]): Promise<ExtractedKeyword[]> {
    if (data.length === 0) return [];
    return db.insert(extractedKeywords).values(data).returning();
  }
}

export const storage = new DatabaseStorage();
