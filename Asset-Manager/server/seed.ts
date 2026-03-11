import { db } from "./db";
import { projects, keywords, clusters, clusterKeywords, contentPlans } from "@shared/schema";
import { count } from "drizzle-orm";

export async function seedDatabase() {
  const [{ count: projectCount }] = await db.select({ count: count() }).from(projects);
  if (projectCount > 0) return;

  console.log("Seeding database with sample data...");

  const [p1] = await db.insert(projects).values({
    name: "TechBlog Pro",
    domain: "techblogpro.com",
  }).returning();

  const [p2] = await db.insert(projects).values({
    name: "Fitness Authority",
    domain: "fitnessauthority.io",
  }).returning();

  const techKeywords = [
    "best seo tools 2024", "free seo tools for beginners", "seo audit tools",
    "keyword research tools", "how to do keyword research", "keyword research guide",
    "backlink analysis tools", "link building strategies", "how to build backlinks",
    "on-page seo checklist", "on-page seo best practices", "meta tags optimization",
    "technical seo audit", "site speed optimization", "core web vitals guide",
    "content optimization tools", "content marketing strategy", "blog post seo tips",
    "local seo tools", "google my business optimization", "local search ranking factors",
  ];

  const techKws = await db.insert(keywords).values(
    techKeywords.map(kw => ({ projectId: p1.id, keyword: kw }))
  ).returning();

  const fitnessKeywords = [
    "best home workout routines", "home workout for beginners", "bodyweight exercises",
    "protein powder reviews", "best protein supplements", "whey vs plant protein",
    "weight loss meal plans", "calorie deficit diet", "healthy meal prep ideas",
    "strength training program", "beginner weightlifting guide", "progressive overload",
  ];

  const fitnessKws = await db.insert(keywords).values(
    fitnessKeywords.map(kw => ({ projectId: p2.id, keyword: kw }))
  ).returning();

  const [c1] = await db.insert(clusters).values({
    projectId: p1.id,
    clusterName: "SEO Tools & Software",
    topic: "Reviews and comparisons of SEO tools and software",
  }).returning();

  const [c2] = await db.insert(clusters).values({
    projectId: p1.id,
    clusterName: "Keyword Research",
    topic: "Comprehensive guides on keyword research methodology",
  }).returning();

  const [c3] = await db.insert(clusters).values({
    projectId: p1.id,
    clusterName: "Link Building",
    topic: "Backlink strategies and link building techniques",
  }).returning();

  const [c4] = await db.insert(clusters).values({
    projectId: p1.id,
    clusterName: "On-Page SEO",
    topic: "On-page optimization techniques and best practices",
  }).returning();

  await db.insert(clusterKeywords).values([
    { clusterId: c1.id, keywordId: techKws[0].id },
    { clusterId: c1.id, keywordId: techKws[1].id },
    { clusterId: c1.id, keywordId: techKws[2].id },
    { clusterId: c2.id, keywordId: techKws[3].id },
    { clusterId: c2.id, keywordId: techKws[4].id },
    { clusterId: c2.id, keywordId: techKws[5].id },
    { clusterId: c3.id, keywordId: techKws[6].id },
    { clusterId: c3.id, keywordId: techKws[7].id },
    { clusterId: c3.id, keywordId: techKws[8].id },
    { clusterId: c4.id, keywordId: techKws[9].id },
    { clusterId: c4.id, keywordId: techKws[10].id },
    { clusterId: c4.id, keywordId: techKws[11].id },
  ]);

  await db.insert(contentPlans).values({
    clusterId: c1.id,
    pillarTitle: "The Ultimate Guide to SEO Tools in 2024",
    supportingTitles: [
      "10 Best Free SEO Tools for Beginners",
      "How to Perform a Complete SEO Audit",
      "SEO Tool Comparison: Ahrefs vs SEMrush vs Moz",
    ],
    metaTitle: "Ultimate Guide to SEO Tools 2024 | TechBlog Pro",
    metaDescription: "Discover the best SEO tools for 2024. Compare features, pricing, and find the perfect tool for your SEO strategy.",
    searchIntent: "commercial",
    headings: [
      "What Are SEO Tools?",
      "Types of SEO Tools",
      "Best All-in-One SEO Tools",
      "Free vs Paid SEO Tools",
      "How to Choose the Right SEO Tool",
    ],
    internalLinks: [
      { from: "The Ultimate Guide to SEO Tools", to: "10 Best Free SEO Tools", anchor: "free SEO tools" },
      { from: "10 Best Free SEO Tools", to: "The Ultimate Guide to SEO Tools", anchor: "complete guide to SEO tools" },
      { from: "How to Perform a Complete SEO Audit", to: "The Ultimate Guide to SEO Tools", anchor: "recommended SEO tools" },
    ],
  });

  await db.insert(contentPlans).values({
    clusterId: c2.id,
    pillarTitle: "Complete Keyword Research Guide: From Beginner to Expert",
    supportingTitles: [
      "Top 5 Keyword Research Tools Compared",
      "How to Find Long-Tail Keywords That Convert",
      "Keyword Research for E-Commerce: A Step-by-Step Guide",
    ],
    metaTitle: "Keyword Research Guide 2024 | TechBlog Pro",
    metaDescription: "Learn how to do keyword research like a pro. Complete guide covering tools, techniques, and strategies for finding profitable keywords.",
    searchIntent: "informational",
    headings: [
      "What Is Keyword Research?",
      "Why Keyword Research Matters",
      "Step-by-Step Keyword Research Process",
      "Advanced Keyword Research Techniques",
      "Organizing Your Keywords",
    ],
    internalLinks: [
      { from: "Keyword Research Guide", to: "Top 5 Keyword Research Tools", anchor: "keyword research tools" },
      { from: "Top 5 Keyword Research Tools", to: "Keyword Research Guide", anchor: "keyword research guide" },
    ],
  });

  console.log("Database seeded successfully.");
}
