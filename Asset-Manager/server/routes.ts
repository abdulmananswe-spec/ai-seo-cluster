import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { crawlSite } from "./crawler";
import { extractKeywords } from "./keyword-extractor";
import { scoreSite } from "./seo-scorer";

function getGeminiClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyB7eDZXqtOeM4fmLTS5EfU24P8WgmmUG8A");
}

async function generateJsonResponse(prompt: string, systemPrompt?: string): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: systemPrompt });

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    
    return result.response.text() || "{}";
  } catch (error: any) {
    if (error.message && (error.message.includes("API_KEY_INVALID") || error.message.includes("API key expired"))) {
      throw new Error("Your Gemini API key has expired or is invalid. Please update it in the server configuration.");
    }
    throw error;
  }
}

function parseId(id: string): number | null {
  const num = Number(id);
  return Number.isNaN(num) || num <= 0 ? null : num;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/projects", async (_req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get("/api/projects/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    const project = await storage.getProject(id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  });

  app.post("/api/projects", async (req, res) => {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const project = await storage.createProject(parsed.data);
    res.status(201).json(project);
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    await storage.deleteProject(id);
    res.status(204).send();
  });

  app.get("/api/projects/:id/stats", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    const project = await storage.getProject(id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const [keywordCount, clusterCount, contentPlanCount] = await Promise.all([
      storage.getKeywordCount(id),
      storage.getClusterCount(id),
      storage.getContentPlanCount(id),
    ]);
    res.json({ keywordCount, clusterCount, contentPlanCount });
  });

  app.get("/api/projects/:id/keywords", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    const kws = await storage.getKeywordsByProject(id);
    res.json(kws);
  });

  app.post("/api/projects/:id/keywords", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    const { keywords: kwList } = req.body;
    if (!Array.isArray(kwList) || kwList.length === 0) {
      return res.status(400).json({ message: "keywords array is required" });
    }
    const data = kwList.map((kw: string) => ({ projectId: id, keyword: kw.trim() }));
    const created = await storage.createKeywords(data);
    res.status(201).json(created);
  });

  app.delete("/api/keywords/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid keyword ID" });
    await storage.deleteKeyword(id);
    res.status(204).send();
  });

  app.post("/api/projects/:id/collect-keywords", async (req, res) => {
    const projectId = parseId(req.params.id);
    if (!projectId) return res.status(400).json({ message: "Invalid project ID" });
    const { seedKeyword } = req.body;
    if (!seedKeyword) return res.status(400).json({ message: "seedKeyword is required" });

    try {
      const systemPrompt = `You are an SEO keyword research expert. Given a seed keyword, generate 20-30 highly relevant long-tail keywords that people actually search for. Include a mix of informational, commercial, and transactional intent keywords. Return ONLY a JSON object with a "keywords" key containing an array of strings.`;
      const prompt = `Generate long-tail keywords for the seed keyword: "${seedKeyword}"`;
      
      const content = await generateJsonResponse(prompt, systemPrompt);
      let parsed;
      try { parsed = JSON.parse(content); } catch { parsed = { keywords: [] }; }
      const kwList: string[] = Array.isArray(parsed) ? parsed : (parsed.keywords || []);
      if (kwList.length === 0) {
        return res.status(500).json({ message: "Failed to generate keywords" });
      }

      const existing = await storage.getKeywordsByProject(projectId);
      const existingSet = new Set(existing.map(k => k.keyword.toLowerCase()));
      const newKws = kwList.filter(k => !existingSet.has(k.toLowerCase()));

      if (newKws.length === 0) {
        return res.json({ keywords: [], message: "All keywords already exist" });
      }

      const data = newKws.map(kw => ({ projectId, keyword: kw }));
      const created = await storage.createKeywords(data);
      res.status(201).json(created);
    } catch (error: any) {
      console.error("Keyword collection error:", error);
      res.status(500).json({ message: error.message || "Failed to collect keywords" });
    }
  });

  app.get("/api/projects/:id/clusters", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    const cls = await storage.getClustersByProject(id);
    res.json(cls);
  });

  app.get("/api/clusters/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid cluster ID" });
    const cluster = await storage.getCluster(id);
    if (!cluster) return res.status(404).json({ message: "Cluster not found" });
    const kws = await storage.getClusterKeywords(cluster.id);
    res.json({ ...cluster, keywords: kws });
  });

  app.post("/api/projects/:id/generate-clusters", async (req, res) => {
    const projectId = parseId(req.params.id);
    if (!projectId) return res.status(400).json({ message: "Invalid project ID" });
    const kws = await storage.getKeywordsByProject(projectId);
    if (kws.length < 3) {
      return res.status(400).json({ message: "Need at least 3 keywords to cluster" });
    }

    try {
      const kwTexts = kws.map(k => k.keyword);
      const systemPrompt = `You are an SEO clustering expert. Group the given keywords into semantic clusters based on topic similarity and search intent. Each cluster should have a descriptive name and a brief topic description. Return a JSON object with this structure: {"clusters": [{"name": "Cluster Name", "topic": "Brief topic description", "keywords": ["keyword1", "keyword2"]}]}. Create between 3-8 clusters depending on the number and diversity of keywords. Every keyword must be assigned to exactly one cluster.`;
      const prompt = `Cluster these keywords:\n${kwTexts.join("\n")}`;

      const content = await generateJsonResponse(prompt, systemPrompt);
      let parsed;
      try { parsed = JSON.parse(content); } catch { parsed = { clusters: [] }; }
      const clusterData = parsed.clusters || [];

      if (clusterData.length === 0) {
        return res.status(500).json({ message: "AI failed to generate clusters" });
      }

      await storage.deleteClustersByProject(projectId);

      const kwMap = new Map(kws.map(k => [k.keyword.toLowerCase(), k.id]));
      const createdClusters = [];
      for (const cl of clusterData) {
        const cluster = await storage.createCluster({
          projectId,
          clusterName: cl.name,
          topic: cl.topic,
        });
        const matchedKws: string[] = [];
        for (const kwText of cl.keywords) {
          const kwId = kwMap.get(kwText.toLowerCase());
          if (kwId) {
            await storage.createClusterKeyword({ clusterId: cluster.id, keywordId: kwId });
            matchedKws.push(kwText);
          }
        }
        createdClusters.push({ ...cluster, keywords: matchedKws });
      }

      res.status(201).json(createdClusters);
    } catch (error: any) {
      console.error("Clustering error:", error);
      res.status(500).json({ message: error.message || "Failed to generate clusters" });
    }
  });

  app.get("/api/projects/:id/content-plans", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    const plans = await storage.getContentPlansByProject(id);
    res.json(plans);
  });

  app.get("/api/content-plans/:clusterId", async (req, res) => {
    const id = parseId(req.params.clusterId);
    if (!id) return res.status(400).json({ message: "Invalid cluster ID" });
    const plan = await storage.getContentPlanByCluster(id);
    if (!plan) return res.status(404).json({ message: "Content plan not found" });
    res.json(plan);
  });

  app.post("/api/clusters/:id/generate-content-plan", async (req, res) => {
    const clusterId = parseId(req.params.id);
    if (!clusterId) return res.status(400).json({ message: "Invalid cluster ID" });
    const cluster = await storage.getCluster(clusterId);
    if (!cluster) return res.status(404).json({ message: "Cluster not found" });

    const clusterKws = await storage.getClusterKeywords(clusterId);
    const kwTexts = clusterKws.map(ck => ck.keyword);

    try {
      const systemPrompt = `You are an expert SEO content strategist. Generate a comprehensive content plan for the given keyword cluster. Return a JSON object with: {"pillarTitle": "Main pillar article title", "supportingTitles": ["Supporting article 1", "Supporting article 2", ...], "metaTitle": "SEO meta title (60 chars max)", "metaDescription": "SEO meta description (155 chars max)", "searchIntent": "informational|commercial|transactional|navigational", "headings": ["H2 heading 1", "H2 heading 2", ...], "internalLinks": [{"from": "Article Title", "to": "Another Article Title", "anchor": "suggested anchor text"}]}`;
      const prompt = `Create a content plan for the cluster "${cluster.clusterName}" (${cluster.topic}) with these keywords:\n${kwTexts.join("\n")}`;

      const content = await generateJsonResponse(prompt, systemPrompt);
      let parsed;
      try { parsed = JSON.parse(content); } catch {
        return res.status(500).json({ message: "Failed to parse content plan" });
      }

      await storage.deleteContentPlansByCluster(clusterId);

      const plan = await storage.createContentPlan({
        clusterId,
        pillarTitle: parsed.pillarTitle || "Untitled Pillar",
        supportingTitles: parsed.supportingTitles || [],
        metaTitle: parsed.metaTitle || "",
        metaDescription: parsed.metaDescription || "",
        searchIntent: parsed.searchIntent || "informational",
        headings: parsed.headings || [],
        internalLinks: parsed.internalLinks || [],
      });

      res.status(201).json(plan);
    } catch (error: any) {
      console.error("Content plan error:", error);
      res.status(500).json({ message: error.message || "Failed to generate content plan" });
    }
  });

  app.post("/api/projects/:id/generate-all-content-plans", async (req, res) => {
    const projectId = parseId(req.params.id);
    if (!projectId) return res.status(400).json({ message: "Invalid project ID" });
    const cls = await storage.getClustersByProject(projectId);
    if (cls.length === 0) {
      return res.status(400).json({ message: "No clusters found. Generate clusters first." });
    }

    const results = [];
    for (const cluster of cls) {
      const clusterKws = await storage.getClusterKeywords(cluster.id);
      const kwTexts = clusterKws.map(ck => ck.keyword);

      try {
        const systemPrompt = `You are an expert SEO content strategist. Generate a comprehensive content plan for the given keyword cluster. Return a JSON object with: {"pillarTitle": "Main pillar article title", "supportingTitles": ["Supporting article 1", "Supporting article 2", ...], "metaTitle": "SEO meta title (60 chars max)", "metaDescription": "SEO meta description (155 chars max)", "searchIntent": "informational|commercial|transactional|navigational", "headings": ["H2 heading 1", "H2 heading 2", ...], "internalLinks": [{"from": "Article Title", "to": "Another Article Title", "anchor": "suggested anchor text"}]}`;
        const prompt = `Create a content plan for the cluster "${cluster.clusterName}" (${cluster.topic}) with these keywords:\n${kwTexts.join("\n")}`;
        
        const content = await generateJsonResponse(prompt, systemPrompt);
        const parsed = JSON.parse(content);

        await storage.deleteContentPlansByCluster(cluster.id);

        const plan = await storage.createContentPlan({
          clusterId: cluster.id,
          pillarTitle: parsed.pillarTitle || "Untitled Pillar",
          supportingTitles: parsed.supportingTitles || [],
          metaTitle: parsed.metaTitle || "",
          metaDescription: parsed.metaDescription || "",
          searchIntent: parsed.searchIntent || "informational",
          headings: parsed.headings || [],
          internalLinks: parsed.internalLinks || [],
        });

        results.push({ ...plan, clusterName: cluster.clusterName });
      } catch (error: any) {
        console.error(`Content plan error for cluster ${cluster.id}:`, error);
        results.push({ error: true, clusterId: cluster.id, clusterName: cluster.clusterName, message: error.message });
      }
    }

    res.status(201).json(results);
  });

  // === SERP ANALYSIS ===
  app.get("/api/projects/:id/serp-analyses", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    const analyses = await storage.getSerpAnalysesByProject(id);
    res.json(analyses);
  });

  app.post("/api/projects/:id/analyze-serp", async (req, res) => {
    const projectId = parseId(req.params.id);
    if (!projectId) return res.status(400).json({ message: "Invalid project ID" });
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ message: "keyword is required" });

    try {
      const systemPrompt = `You are an expert SEO analyst. Analyze the given keyword as if you have access to SERP data. Provide realistic estimates based on your knowledge. Return a JSON object with: {"difficulty": 0-100 number, "searchVolume": estimated monthly searches number, "cpc": estimated cost per click number, "intent": "informational|commercial|transactional|navigational", "serpFeatures": ["featured_snippet", "people_also_ask", "video_results", "image_pack", "local_pack", "knowledge_panel", "shopping_results", "news_results", "site_links"], "topResults": [{"position": 1, "title": "Result title", "url": "https://example.com/page", "description": "Meta description"}] (provide 5-10 results)}`;
      const prompt = `Analyze the SERP for the keyword: "${keyword}"`;

      const content = await generateJsonResponse(prompt, systemPrompt);
      const parsed = JSON.parse(content);

      const analysis = await storage.createSerpAnalysis({
        projectId,
        keyword,
        difficulty: parsed.difficulty ?? null,
        searchVolume: parsed.searchVolume ?? null,
        cpc: parsed.cpc ?? null,
        intent: parsed.intent ?? null,
        serpFeatures: parsed.serpFeatures ?? [],
        topResults: parsed.topResults ?? [],
      });

      res.status(201).json(analysis);
    } catch (error: any) {
      console.error("SERP analysis error:", error);
      res.status(500).json({ message: error.message || "Failed to analyze SERP" });
    }
  });

  // === RANK TRACKER ===
  app.get("/api/projects/:id/rank-entries", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    const entries = await storage.getRankEntriesByProject(id);
    res.json(entries);
  });

  app.post("/api/projects/:id/track-rankings", async (req, res) => {
    const projectId = parseId(req.params.id);
    if (!projectId) return res.status(400).json({ message: "Invalid project ID" });
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const kws = await storage.getKeywordsByProject(projectId);
    if (kws.length === 0) {
      return res.status(400).json({ message: "No keywords to track. Add keywords first." });
    }

    try {
      const existingEntries = await storage.getRankEntriesByProject(projectId);
      const previousPositions = new Map<string, number>();
      for (const e of existingEntries) {
        if (!previousPositions.has(e.keyword) && e.position) {
          previousPositions.set(e.keyword, e.position);
        }
      }

      const kwTexts = kws.map(k => k.keyword).slice(0, 20);
      const systemPrompt = `You are an SEO rank tracking tool. Given a domain and keywords, estimate the current Google search position for each keyword. Return a JSON object: {"rankings": [{"keyword": "keyword text", "position": 1-100 or null if not ranking, "url": "https://domain.com/page-that-ranks"}]}`;
      const prompt = `Estimate Google rankings for domain "${project.domain}" for these keywords:\n${kwTexts.join("\n")}`;

      const content = await generateJsonResponse(prompt, systemPrompt);
      const parsed = JSON.parse(content);
      const rankings = parsed.rankings || [];

      const entries = rankings.map((r: any) => ({
        projectId,
        keyword: r.keyword,
        position: r.position ?? null,
        url: r.url ?? null,
        previousPosition: previousPositions.get(r.keyword) ?? null,
      }));

      const created = await storage.createRankEntries(entries);
      res.status(201).json(created);
    } catch (error: any) {
      console.error("Rank tracking error:", error);
      res.status(500).json({ message: error.message || "Failed to track rankings" });
    }
  });

  // === COMPETITORS ===
  app.get("/api/projects/:id/competitors", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    const comps = await storage.getCompetitorsByProject(id);
    res.json(comps);
  });

  app.post("/api/projects/:id/competitors", async (req, res) => {
    const projectId = parseId(req.params.id);
    if (!projectId) return res.status(400).json({ message: "Invalid project ID" });
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ message: "domain is required" });
    const comp = await storage.createCompetitor({ projectId, domain });
    res.status(201).json(comp);
  });

  app.delete("/api/competitors/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid competitor ID" });
    await storage.deleteCompetitor(id);
    res.status(204).send();
  });

  app.get("/api/competitors/:id/analysis", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid competitor ID" });
    const analysis = await storage.getCompetitorAnalysis(id);
    if (!analysis) return res.status(404).json({ message: "No analysis found" });
    res.json(analysis);
  });

  app.post("/api/competitors/:id/analyze", async (req, res) => {
    const competitorId = parseId(req.params.id);
    if (!competitorId) return res.status(400).json({ message: "Invalid competitor ID" });
    const competitor = await storage.getCompetitor(competitorId);
    if (!competitor) return res.status(404).json({ message: "Competitor not found" });

    const project = await storage.getProject(competitor.projectId);
    const projectKws = await storage.getKeywordsByProject(competitor.projectId);

    try {
      const systemPrompt = `You are an expert SEO competitor analyst. Analyze the given competitor domain and provide detailed insights. Return a JSON object: {"domainAuthority": 0-100, "organicKeywords": estimated number, "organicTraffic": estimated monthly traffic, "topKeywords": [{"keyword": "text", "position": 1-10, "volume": monthly volume}] (5-10 keywords), "contentGaps": ["topic areas the competitor covers that we don't"] (3-5 items), "strengths": ["what they do well"] (3-5 items), "weaknesses": ["where they fall short"] (3-5 items)}`;
      const prompt = `Analyze competitor domain "${competitor.domain}" compared to "${project?.domain || 'our site'}". Our keywords include: ${projectKws.slice(0, 10).map(k => k.keyword).join(", ")}`;

      const content = await generateJsonResponse(prompt, systemPrompt);
      const parsed = JSON.parse(content);

      const analysis = await storage.createCompetitorAnalysis({
        competitorId,
        domainAuthority: parsed.domainAuthority ?? null,
        organicKeywords: parsed.organicKeywords ?? null,
        organicTraffic: parsed.organicTraffic ?? null,
        topKeywords: parsed.topKeywords ?? [],
        contentGaps: parsed.contentGaps ?? [],
        strengths: parsed.strengths ?? [],
        weaknesses: parsed.weaknesses ?? [],
      });

      res.status(201).json(analysis);
    } catch (error: any) {
      console.error("Competitor analysis error:", error);
      res.status(500).json({ message: error.message || "Failed to analyze competitor" });
    }
  });

  // === BACKLINK ANALYZER ===
  app.get("/api/projects/:id/backlink-analyses", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    const analyses = await storage.getBacklinkAnalysesByProject(id);
    res.json(analyses);
  });

  app.post("/api/projects/:id/analyze-backlinks", async (req, res) => {
    const projectId = parseId(req.params.id);
    if (!projectId) return res.status(400).json({ message: "Invalid project ID" });
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ message: "domain is required" });

    try {
      const systemPrompt = `You are an expert backlink analyst. Analyze the given domain's backlink profile and provide realistic estimates. Return a JSON object: {"totalBacklinks": number, "referringDomains": number, "domainAuthority": 0-100, "topBacklinks": [{"source": "referring-domain.com", "target": "https://domain.com/page", "anchor": "anchor text", "authority": 0-100, "type": "dofollow|nofollow"}] (8-12 backlinks), "anchorDistribution": [{"anchor": "text", "count": number, "percentage": number}] (6-8 anchors)}`;
      const prompt = `Analyze the backlink profile for domain: "${domain}"`;

      const content = await generateJsonResponse(prompt, systemPrompt);
      const parsed = JSON.parse(content);

      const analysis = await storage.createBacklinkAnalysis({
        projectId,
        domain,
        totalBacklinks: parsed.totalBacklinks ?? null,
        referringDomains: parsed.referringDomains ?? null,
        domainAuthority: parsed.domainAuthority ?? null,
        topBacklinks: parsed.topBacklinks ?? [],
        anchorDistribution: parsed.anchorDistribution ?? [],
      });

      res.status(201).json(analysis);
    } catch (error: any) {
      console.error("Backlink analysis error:", error);
      res.status(500).json({ message: error.message || "Failed to analyze backlinks" });
    }
  });

  // === SEARCH CONSOLE DATA ===
  app.get("/api/projects/:id/search-console", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    const data = await storage.getSearchConsoleDataByProject(id);
    res.json(data);
  });

  app.post("/api/projects/:id/search-console/import", async (req, res) => {
    const projectId = parseId(req.params.id);
    if (!projectId) return res.status(400).json({ message: "Invalid project ID" });
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "data array is required" });
    }

    const entries = data.map((d: any) => ({
      projectId,
      query: d.query || "",
      clicks: d.clicks ?? 0,
      impressions: d.impressions ?? 0,
      ctr: d.ctr ?? 0,
      position: d.position ?? 0,
      page: d.page ?? null,
      date: d.date ?? null,
    }));

    const created = await storage.createSearchConsoleDataBatch(entries);
    res.status(201).json(created);
  });

  app.post("/api/projects/:id/search-console/simulate", async (req, res) => {
    const projectId = parseId(req.params.id);
    if (!projectId) return res.status(400).json({ message: "Invalid project ID" });
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const kws = await storage.getKeywordsByProject(projectId);
    if (kws.length === 0) {
      return res.status(400).json({ message: "No keywords found. Add keywords first." });
    }

    try {
      const kwTexts = kws.slice(0, 20).map(k => k.keyword);
      const systemPrompt = `You are simulating Google Search Console data for an SEO tool. Generate realistic search performance data for the given domain and keywords. Return a JSON object: {"data": [{"query": "search query", "clicks": number, "impressions": number, "ctr": 0-1 decimal, "position": 1-100 decimal, "page": "/page-path", "date": "2024-03-01"}]}. Generate data for each keyword with realistic numbers. Use dates within the last 30 days.`;
      const prompt = `Generate Search Console data for domain "${project.domain}" with these keywords:\n${kwTexts.join("\n")}`;

      const content = await generateJsonResponse(prompt, systemPrompt);
      const parsed = JSON.parse(content);
      const simData = parsed.data || [];

      await storage.deleteSearchConsoleDataByProject(projectId);

      const entries = simData.map((d: any) => ({
        projectId,
        query: d.query || "",
        clicks: d.clicks ?? 0,
        impressions: d.impressions ?? 0,
        ctr: d.ctr ?? 0,
        position: d.position ?? 0,
        page: d.page ?? null,
        date: d.date ?? null,
      }));

      const created = await storage.createSearchConsoleDataBatch(entries);
      res.status(201).json(created);
    } catch (error: any) {
      console.error("Search console simulation error:", error);
      res.status(500).json({ message: error.message || "Failed to simulate data" });
    }
  });

  // === SITE ANALYZER ===
  app.get("/api/projects/:id/site-analyses", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid project ID" });
    const analyses = await storage.getSiteAnalysesByProject(id);
    res.json(analyses);
  });

  app.get("/api/site-analyses/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid analysis ID" });
    const analysis = await storage.getSiteAnalysis(id);
    if (!analysis) return res.status(404).json({ message: "Analysis not found" });
    res.json(analysis);
  });

  app.get("/api/site-analyses/:id/pages", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid analysis ID" });
    const pages = await storage.getCrawledPages(id);
    res.json(pages);
  });

  app.get("/api/site-analyses/:id/keywords", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid analysis ID" });
    const keywords = await storage.getExtractedKeywords(id);
    res.json(keywords);
  });

  app.post("/api/projects/:id/analyze-site", async (req, res) => {
    const projectId = parseId(req.params.id);
    if (!projectId) return res.status(400).json({ message: "Invalid project ID" });

    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const { url } = req.body;
    if (!url || typeof url !== "string") return res.status(400).json({ message: "url is required" });

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({ message: "Only http/https URLs are allowed" });
      }
    } catch {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    const analysis = await storage.createSiteAnalysis({
      projectId,
      url: parsedUrl.href,
      status: "crawling",
    });

    res.status(202).json(analysis);

    (async () => {
      try {
        await storage.updateSiteAnalysis(analysis.id, { status: "crawling" });
        const crawledData = await crawlSite(parsedUrl.href, 30);

        if (crawledData.length === 0) {
          await storage.updateSiteAnalysis(analysis.id, { status: "failed", totalPages: 0 });
          return;
        }

        await storage.updateSiteAnalysis(analysis.id, { status: "analyzing", totalPages: crawledData.length });

        const seoResult = scoreSite(crawledData);
        const extractedKws = extractKeywords(crawledData, 100);

        const pageRecords = crawledData.map((page, i) => ({
          siteAnalysisId: analysis.id,
          url: page.url,
          title: page.title || null,
          metaDescription: page.metaDescription || null,
          h1: page.h1 || null,
          h2s: page.h2s,
          wordCount: page.wordCount,
          internalLinks: page.internalLinks,
          externalLinks: page.externalLinks,
          pageAuthority: seoResult.pageScores[i]?.pageAuthority ?? null,
          keywordDensity: seoResult.pageScores[i]?.keywordDensity ?? null,
          seoIssues: seoResult.pageScores[i]?.issues ?? [],
        }));
        await storage.createCrawledPages(pageRecords);

        let aiEnhancedKeywords = extractedKws;
        try {
          const topKws = extractedKws.slice(0, 30).map(k => k.keyword);
          const systemPrompt = `You are an SEO expert. Given a list of keywords extracted from a website, estimate the search difficulty (0-100), monthly search volume, and assign a topical cluster name to each. Return JSON: {"keywords": [{"keyword": "text", "difficulty": 0-100, "searchVolume": number, "cluster": "cluster name"}]}`;
          const prompt = `Analyze these keywords extracted from ${parsedUrl.hostname}:\n${topKws.join("\n")}`;

          const content = await generateJsonResponse(prompt, systemPrompt);
          const aiData = JSON.parse(content);
          const aiMap = new Map<string, { difficulty: number; searchVolume: number; cluster: string }>();
          for (const k of (aiData.keywords || [])) {
            aiMap.set(k.keyword, k);
          }
          aiEnhancedKeywords = extractedKws.map(k => {
            const ai = aiMap.get(k.keyword);
            return ai ? { ...k, difficulty: ai.difficulty, searchVolume: ai.searchVolume, cluster: ai.cluster } : k;
          });
        } catch (e) {
          console.warn("AI keyword enhancement failed, using raw extraction:", e);
        }

        const kwRecords = aiEnhancedKeywords.map(k => ({
          siteAnalysisId: analysis.id,
          keyword: k.keyword,
          frequency: k.frequency,
          tfidfScore: k.tfidfScore,
          isLongTail: k.isLongTail ? 1 : 0,
          difficulty: (k as any).difficulty ?? null,
          searchVolume: (k as any).searchVolume ?? null,
          cluster: (k as any).cluster ?? null,
        }));
        await storage.createExtractedKeywords(kwRecords);

        let domainAuthority = seoResult.overallScore;
        try {
          const systemPrompt = `You are an SEO domain authority estimator. Given a domain, its on-page SEO score, number of pages crawled, and top keywords, estimate the domain authority (0-100). Also suggest content opportunities. Return JSON: {"domainAuthority": number, "contentOpportunities": ["opportunity 1", "opportunity 2", ...]}`;
          const prompt = `Domain: ${parsedUrl.hostname}\nOn-page SEO score: ${seoResult.overallScore}\nPages crawled: ${crawledData.length}\nTop keywords: ${extractedKws.slice(0, 10).map(k => k.keyword).join(", ")}`;

          const content = await generateJsonResponse(prompt, systemPrompt);
          const aiDa = JSON.parse(content || "{}");
          domainAuthority = aiDa.domainAuthority ?? seoResult.overallScore;

          const totalIssues = seoResult.pageScores.reduce((sum, ps) => sum + ps.issues.length, 0);
          const avgWordCount = Math.round(crawledData.reduce((sum, p) => sum + p.wordCount, 0) / crawledData.length);
          const avgPageAuth = Math.round(seoResult.pageScores.reduce((sum, ps) => sum + ps.pageAuthority, 0) / seoResult.pageScores.length);

          await storage.updateSiteAnalysis(analysis.id, {
            status: "complete",
            seoScore: seoResult.overallScore,
            domainAuthority,
            totalPages: crawledData.length,
            totalKeywordsFound: extractedKws.length,
            issuesCount: totalIssues,
            summary: {
              avgWordCount,
              avgPageAuthority: avgPageAuth,
              topIssues: seoResult.topIssues.slice(0, 5),
              contentOpportunities: aiDa.contentOpportunities?.slice(0, 5) || [],
            },
          });
        } catch (e) {
          console.warn("AI domain authority estimation failed:", e);
          const totalIssues = seoResult.pageScores.reduce((sum, ps) => sum + ps.issues.length, 0);
          const avgWordCount = Math.round(crawledData.reduce((sum, p) => sum + p.wordCount, 0) / crawledData.length);
          const avgPageAuth = Math.round(seoResult.pageScores.reduce((sum, ps) => sum + ps.pageAuthority, 0) / seoResult.pageScores.length);

          await storage.updateSiteAnalysis(analysis.id, {
            status: "complete",
            seoScore: seoResult.overallScore,
            domainAuthority,
            totalPages: crawledData.length,
            totalKeywordsFound: extractedKws.length,
            issuesCount: totalIssues,
            summary: {
              avgWordCount,
              avgPageAuthority: avgPageAuth,
              topIssues: seoResult.topIssues.slice(0, 5),
              contentOpportunities: [],
            },
          });
        }
      } catch (error: any) {
        console.error("Site analysis error:", error);
        await storage.updateSiteAnalysis(analysis.id, { status: "failed" }).catch(() => {});
      }
    })();
  });

  app.post("/api/site-analyses/:id/generate-content-ideas", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid analysis ID" });
    const analysis = await storage.getSiteAnalysis(id);
    if (!analysis) return res.status(404).json({ message: "Analysis not found" });

    try {
      const keywords = await storage.getExtractedKeywords(id);
      const topKws = keywords.slice(0, 20).map(k => k.keyword);
      const systemPrompt = `You are an expert SEO content strategist. Based on the extracted keywords from a website, generate content ideas including blog titles, content outlines, and SEO-optimized article suggestions. Return JSON: {"ideas": [{"title": "Blog Title", "type": "blog|guide|comparison|listicle", "targetKeyword": "main keyword", "outline": ["H2 Section 1", "H2 Section 2", ...], "estimatedTraffic": number, "priority": "high|medium|low"}]} Generate 8-12 ideas.`;
      const prompt = `Generate content ideas for ${analysis.url} based on these keywords:\n${topKws.join("\n")}`;

      const content = await generateJsonResponse(prompt, systemPrompt);
      const parsed = JSON.parse(content);
      res.json(parsed.ideas || []);
    } catch (error: any) {
      console.error("Content ideas error:", error);
      res.status(500).json({ message: error.message || "Failed to generate content ideas" });
    }
  });

  app.post("/api/generate-long-tail", async (req, res) => {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ message: "keyword is required" });

    try {
      const systemPrompt = `You are an SEO keyword research tool. Given a seed keyword, generate long-tail keyword variations that people actually search for. Include question-based keywords, comparison keywords, and specific intent keywords. Return JSON: {"longTailKeywords": [{"keyword": "long tail keyword", "intent": "informational|commercial|transactional", "estimatedVolume": number, "difficulty": 0-100}]} Generate 15-20 keywords.`;
      const prompt = `Generate long-tail keywords for: "${keyword}"`;

      const content = await generateJsonResponse(prompt, systemPrompt);
      const parsed = JSON.parse(content);
      res.json(parsed.longTailKeywords || []);
    } catch (error: any) {
      console.error("Long-tail generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate long-tail keywords" });
    }
  });

  app.get("/api/dashboard-stats", async (_req, res) => {
    const allProjects = await storage.getProjects();
    let totalKeywords = 0;
    let totalClusters = 0;
    let totalContentPlans = 0;

    for (const p of allProjects) {
      const [kc, cc, cpc] = await Promise.all([
        storage.getKeywordCount(p.id),
        storage.getClusterCount(p.id),
        storage.getContentPlanCount(p.id),
      ]);
      totalKeywords += kc;
      totalClusters += cc;
      totalContentPlans += cpc;
    }

    res.json({
      totalProjects: allProjects.length,
      totalKeywords,
      totalClusters,
      totalContentPlans,
      recentProjects: allProjects.slice(0, 5),
    });
  });

  return httpServer;
}
