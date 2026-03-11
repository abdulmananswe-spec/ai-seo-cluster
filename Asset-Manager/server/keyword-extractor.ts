import natural from "natural";
import type { CrawledPageData } from "./crawler";

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "is", "was", "are", "were", "be", "been", "being", "have", "has",
  "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can",
  "shall", "this", "that", "these", "those", "it", "its", "i", "you", "he", "she", "we",
  "they", "my", "your", "his", "her", "our", "their", "me", "him", "us", "them", "not",
  "no", "if", "then", "than", "so", "very", "just", "about", "also", "more", "other",
  "some", "any", "all", "each", "every", "both", "few", "many", "much", "most", "such",
  "what", "which", "who", "whom", "how", "when", "where", "why", "up", "out", "off",
  "over", "under", "again", "once", "here", "there", "only", "own", "same", "into",
  "too", "between", "through", "during", "before", "after", "above", "below", "while",
  "get", "got", "make", "made", "take", "like", "know", "go", "going", "come", "see",
  "use", "using", "new", "one", "two", "way", "first", "well", "even", "back",
  "cookie", "cookies", "privacy", "policy", "terms", "conditions", "copyright",
  "menu", "home", "contact", "login", "sign", "search", "click", "read", "share",
]);

export interface ExtractedKeywordData {
  keyword: string;
  frequency: number;
  tfidfScore: number;
  isLongTail: boolean;
}

function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNGrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    const gram = tokens.slice(i, i + n).join(" ");
    ngrams.push(gram);
  }
  return ngrams;
}

export function extractKeywords(pages: CrawledPageData[], maxKeywords: number = 100): ExtractedKeywordData[] {
  if (pages.length === 0) return [];

  const tfidf = new TfIdf();
  const allTexts: string[] = [];

  for (const page of pages) {
    const combined = [page.title, page.metaDescription, page.h1, ...page.h2s, page.bodyText]
      .filter(Boolean)
      .join(" ");
    const cleaned = cleanText(combined);
    allTexts.push(cleaned);
    tfidf.addDocument(cleaned);
  }

  const globalFrequency = new Map<string, number>();
  const globalTfidf = new Map<string, number>();

  for (let docIndex = 0; docIndex < allTexts.length; docIndex++) {
    const tokens = tokenizer.tokenize(allTexts[docIndex]) || [];
    const filteredTokens = tokens.filter(t => t.length > 2 && !STOP_WORDS.has(t) && !/^\d+$/.test(t));

    for (const token of filteredTokens) {
      globalFrequency.set(token, (globalFrequency.get(token) || 0) + 1);
    }

    const bigrams = extractNGrams(filteredTokens, 2);
    for (const bg of bigrams) {
      globalFrequency.set(bg, (globalFrequency.get(bg) || 0) + 1);
    }

    const trigrams = extractNGrams(filteredTokens, 3);
    for (const tg of trigrams) {
      globalFrequency.set(tg, (globalFrequency.get(tg) || 0) + 1);
    }

    tfidf.listTerms(docIndex).forEach((item: { term: string; tfidf: number }) => {
      const current = globalTfidf.get(item.term) || 0;
      if (item.tfidf > current) {
        globalTfidf.set(item.term, item.tfidf);
      }
    });
  }

  const minFreq = 2;
  const candidates: ExtractedKeywordData[] = [];

  for (const [keyword, frequency] of globalFrequency.entries()) {
    if (frequency < minFreq) continue;
    if (keyword.length < 3) continue;

    const words = keyword.split(" ");
    if (words.some(w => STOP_WORDS.has(w))) continue;

    const tfidfScore = globalTfidf.get(keyword) || 0;
    const isLongTail = words.length >= 3;

    const score = (tfidfScore * 0.6) + (frequency * 0.3) + (isLongTail ? 5 : 0);

    candidates.push({
      keyword,
      frequency,
      tfidfScore: Math.round(score * 100) / 100,
      isLongTail,
    });
  }

  candidates.sort((a, b) => b.tfidfScore - a.tfidfScore);

  return candidates.slice(0, maxKeywords);
}
