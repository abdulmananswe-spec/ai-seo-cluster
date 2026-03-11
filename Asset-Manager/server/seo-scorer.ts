import type { CrawledPageData } from "./crawler";

export interface PageSeoScore {
  url: string;
  pageAuthority: number;
  keywordDensity: number;
  issues: { issue: string; severity: string; description: string }[];
}

export interface SiteSeoResult {
  overallScore: number;
  pageScores: PageSeoScore[];
  topIssues: string[];
  issuesByCategory: Record<string, number>;
}

function scoreTitle(title: string): { score: number; issues: { issue: string; severity: string; description: string }[] } {
  const issues: { issue: string; severity: string; description: string }[] = [];
  let score = 0;

  if (!title) {
    issues.push({ issue: "Missing Title", severity: "high", description: "Page has no title tag." });
    return { score: 0, issues };
  }

  score += 10;

  if (title.length < 30) {
    issues.push({ issue: "Short Title", severity: "medium", description: `Title is ${title.length} chars. Recommended: 50-60 chars.` });
    score += 3;
  } else if (title.length > 60) {
    issues.push({ issue: "Long Title", severity: "low", description: `Title is ${title.length} chars. May be truncated in SERPs.` });
    score += 6;
  } else {
    score += 10;
  }

  return { score, issues };
}

function scoreMetaDescription(desc: string): { score: number; issues: { issue: string; severity: string; description: string }[] } {
  const issues: { issue: string; severity: string; description: string }[] = [];
  let score = 0;

  if (!desc) {
    issues.push({ issue: "Missing Meta Description", severity: "high", description: "Page has no meta description." });
    return { score: 0, issues };
  }

  score += 5;

  if (desc.length < 100) {
    issues.push({ issue: "Short Meta Description", severity: "medium", description: `Meta description is ${desc.length} chars. Recommended: 120-155 chars.` });
    score += 2;
  } else if (desc.length > 160) {
    issues.push({ issue: "Long Meta Description", severity: "low", description: `Meta description is ${desc.length} chars. May be truncated.` });
    score += 4;
  } else {
    score += 5;
  }

  return { score, issues };
}

function scoreHeadings(h1: string, h2s: string[]): { score: number; issues: { issue: string; severity: string; description: string }[] } {
  const issues: { issue: string; severity: string; description: string }[] = [];
  let score = 0;

  if (!h1) {
    issues.push({ issue: "Missing H1", severity: "high", description: "Page has no H1 heading." });
  } else {
    score += 10;
  }

  if (h2s.length === 0) {
    issues.push({ issue: "No H2 Headings", severity: "medium", description: "Page has no H2 headings for content structure." });
  } else if (h2s.length >= 2) {
    score += 10;
  } else {
    score += 5;
  }

  return { score, issues };
}

function scoreContent(wordCount: number): { score: number; issues: { issue: string; severity: string; description: string }[] } {
  const issues: { issue: string; severity: string; description: string }[] = [];
  let score = 0;

  if (wordCount < 100) {
    issues.push({ issue: "Thin Content", severity: "high", description: `Only ${wordCount} words. Pages should have 300+ words.` });
  } else if (wordCount < 300) {
    issues.push({ issue: "Short Content", severity: "medium", description: `Only ${wordCount} words. Consider adding more content.` });
    score += 5;
  } else if (wordCount >= 1000) {
    score += 20;
  } else {
    score += 10;
  }

  return { score, issues };
}

function scoreLinks(internalLinks: string[], externalLinks: string[]): { score: number; issues: { issue: string; severity: string; description: string }[] } {
  const issues: { issue: string; severity: string; description: string }[] = [];
  let score = 0;

  if (internalLinks.length === 0) {
    issues.push({ issue: "No Internal Links", severity: "medium", description: "Page has no internal links." });
  } else if (internalLinks.length >= 3) {
    score += 10;
  } else {
    score += 5;
  }

  if (externalLinks.length === 0) {
    score += 5;
  } else if (externalLinks.length > 50) {
    issues.push({ issue: "Too Many External Links", severity: "low", description: `Page has ${externalLinks.length} external links.` });
    score += 2;
  } else {
    score += 5;
  }

  return { score, issues };
}

function scoreImages(images: { src: string; alt: string }[]): { score: number; issues: { issue: string; severity: string; description: string }[] } {
  const issues: { issue: string; severity: string; description: string }[] = [];
  let score = 5;

  if (images.length > 0) {
    const missingAlt = images.filter(img => !img.alt).length;
    if (missingAlt > 0) {
      issues.push({
        issue: "Images Missing Alt Text",
        severity: "medium",
        description: `${missingAlt} of ${images.length} images are missing alt text.`
      });
      score += Math.max(0, 5 - missingAlt);
    } else {
      score += 5;
    }
  }

  return { score, issues };
}

export function scorePage(page: CrawledPageData): PageSeoScore {
  const allIssues: { issue: string; severity: string; description: string }[] = [];
  let totalScore = 0;
  const maxScore = 80;

  const titleResult = scoreTitle(page.title);
  totalScore += titleResult.score;
  allIssues.push(...titleResult.issues);

  const metaResult = scoreMetaDescription(page.metaDescription);
  totalScore += metaResult.score;
  allIssues.push(...metaResult.issues);

  const headingResult = scoreHeadings(page.h1, page.h2s);
  totalScore += headingResult.score;
  allIssues.push(...headingResult.issues);

  const contentResult = scoreContent(page.wordCount);
  totalScore += contentResult.score;
  allIssues.push(...contentResult.issues);

  const linkResult = scoreLinks(page.internalLinks, page.externalLinks);
  totalScore += linkResult.score;
  allIssues.push(...linkResult.issues);

  const imageResult = scoreImages(page.images);
  totalScore += imageResult.score;
  allIssues.push(...imageResult.issues);

  const normalizedScore = Math.min(100, Math.round((totalScore / maxScore) * 100));

  const topKeywords = page.bodyText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const wordFreq = new Map<string, number>();
  for (const w of topKeywords) { wordFreq.set(w, (wordFreq.get(w) || 0) + 1); }
  const totalWords = topKeywords.length || 1;
  const maxDensity = Math.max(...Array.from(wordFreq.values())) / totalWords;

  return {
    url: page.url,
    pageAuthority: normalizedScore,
    keywordDensity: Math.round(maxDensity * 10000) / 100,
    issues: allIssues,
  };
}

export function scoreSite(pages: CrawledPageData[]): SiteSeoResult {
  if (pages.length === 0) {
    return { overallScore: 0, pageScores: [], topIssues: [], issuesByCategory: {} };
  }

  const pageScores = pages.map(p => scorePage(p));
  const overallScore = Math.round(pageScores.reduce((sum, ps) => sum + ps.pageAuthority, 0) / pageScores.length);

  const issueCount = new Map<string, number>();
  for (const ps of pageScores) {
    for (const issue of ps.issues) {
      issueCount.set(issue.issue, (issueCount.get(issue.issue) || 0) + 1);
    }
  }

  const topIssues = Array.from(issueCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([issue, count]) => `${issue} (${count} pages)`);

  const issuesByCategory: Record<string, number> = {};
  for (const [issue, count] of issueCount.entries()) {
    issuesByCategory[issue] = count;
  }

  return { overallScore, pageScores, topIssues, issuesByCategory };
}
