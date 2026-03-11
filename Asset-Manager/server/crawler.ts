import * as cheerio from "cheerio";

export interface CrawledPageData {
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  h2s: string[];
  bodyText: string;
  wordCount: number;
  internalLinks: string[];
  externalLinks: string[];
  images: { src: string; alt: string }[];
  statusCode: number;
}

function normalizeUrl(url: string, baseUrl: string): string | null {
  try {
    const resolved = new URL(url, baseUrl);
    resolved.hash = "";
    resolved.search = "";
    return resolved.href;
  } catch {
    return null;
  }
}

function isSameDomain(url: string, baseDomain: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === baseDomain || u.hostname.endsWith(`.${baseDomain}`);
  } catch {
    return false;
  }
}

function isValidPageUrl(url: string): boolean {
  const skipExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".mp4", ".mp3", ".zip", ".css", ".js", ".xml", ".json"];
  const lower = url.toLowerCase();
  return !skipExtensions.some(ext => lower.endsWith(ext));
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]",
  "metadata.google.internal", "169.254.169.254",
]);

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lower)) return true;
  if (lower.endsWith(".local") || lower.endsWith(".internal") || lower.endsWith(".localhost")) return true;
  const parts = lower.split(".");
  if (parts.length === 4 && parts.every(p => /^\d+$/.test(p))) {
    const octets = parts.map(Number);
    if (octets[0] === 10) return true;
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    if (octets[0] === 192 && octets[1] === 168) return true;
    if (octets[0] === 127) return true;
    if (octets[0] === 169 && octets[1] === 254) return true;
    if (octets[0] === 0) return true;
  }
  return false;
}

export async function crawlSite(startUrl: string, maxPages: number = 50): Promise<CrawledPageData[]> {
  let baseUrl: URL;
  try {
    baseUrl = new URL(startUrl);
  } catch {
    throw new Error("Invalid URL provided");
  }

  if (!["http:", "https:"].includes(baseUrl.protocol)) {
    throw new Error("Only http and https protocols are allowed");
  }

  if (isBlockedHost(baseUrl.hostname)) {
    throw new Error("This hostname is not allowed");
  }

  const baseDomain = baseUrl.hostname;
  const visited = new Set<string>();
  const queue: string[] = [baseUrl.href];
  const results: CrawledPageData[] = [];

  while (queue.length > 0 && results.length < maxPages) {
    const url = queue.shift()!;
    const normalizedUrl = normalizeUrl(url, baseUrl.href);
    if (!normalizedUrl || visited.has(normalizedUrl)) continue;
    visited.add(normalizedUrl);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "AI-SEO-Analyzer/1.0 (compatible; educational crawler)",
          "Accept": "text/html",
        },
        redirect: "manual",
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (location) {
          const resolved = normalizeUrl(location, normalizedUrl);
          if (resolved && isSameDomain(resolved, baseDomain) && !isBlockedHost(new URL(resolved).hostname)) {
            queue.unshift(resolved);
          }
        }
        continue;
      }
      clearTimeout(timeout);

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) continue;

      const html = await response.text();
      const $ = cheerio.load(html);

      $("script, style, noscript, nav, footer, header").remove();

      const title = $("title").first().text().trim();
      const metaDescription = $('meta[name="description"]').attr("content")?.trim() || "";
      const h1 = $("h1").first().text().trim();
      const h2s = $("h2").map((_i, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 20);

      const bodyText = $("body").text().replace(/\s+/g, " ").trim();
      const words = bodyText.split(/\s+/).filter(w => w.length > 1);

      const internalLinks: string[] = [];
      const externalLinks: string[] = [];

      $("a[href]").each((_i, el) => {
        const href = $(el).attr("href");
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;

        const resolved = normalizeUrl(href, normalizedUrl);
        if (!resolved) return;

        if (isSameDomain(resolved, baseDomain)) {
          internalLinks.push(resolved);
          if (isValidPageUrl(resolved) && !visited.has(resolved) && results.length + queue.length < maxPages * 2) {
            queue.push(resolved);
          }
        } else {
          externalLinks.push(resolved);
        }
      });

      const images = $("img").map((_i, el) => ({
        src: $(el).attr("src") || "",
        alt: $(el).attr("alt") || "",
      })).get().slice(0, 50);

      results.push({
        url: normalizedUrl,
        title,
        metaDescription,
        h1,
        h2s,
        bodyText: bodyText.slice(0, 10000),
        wordCount: words.length,
        internalLinks: [...new Set(internalLinks)],
        externalLinks: [...new Set(externalLinks)],
        images,
        statusCode: response.status,
      });

    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.warn(`Crawl error for ${normalizedUrl}: ${error.message}`);
      }
    }
  }

  return results;
}
