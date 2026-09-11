import * as cheerio from "cheerio";
import { crawl } from "./crawler.js";
import { sanitize } from "./sanitizer.js";

const GFG_SEARCH = "https://www.geeksforgeeks.org/search/?gq=";

/**
 * may scale later, for now just use geeksforgeeks
 * Fetch the first GeeksforGeeks interview experience article
 * for a given company.
 *
 * Returns:
 * [
 *   {
 *     title,
 *     url,
 *     text
 *   }
 * ]
 */
export async function crawlPublicDiscussion(companyName) {
  const query = encodeURIComponent(`${companyName} interview experience`);
  const searchUrl = `${GFG_SEARCH}${query}`;

  const search = await crawl(searchUrl);
  if (!search.ok) return [];

  const $ = cheerio.load(search.html);

  // First article link from search results
  let firstUrl = null;

  $("a[href]").each((_, el) => {
    if (firstUrl) return;

    const href = $(el).attr("href");
    if (!href) return;

    // Ignore navigation/search links
    if (
      href.includes("/search/") ||
      href.includes("#") ||
      href.includes("javascript:")
    )
      return;

    // Prefer interview experience articles
    if (
      href.includes("interview-experience") ||
      href.toLowerCase().includes(companyName.toLowerCase())
    ) {
      firstUrl = new URL(href, "https://www.geeksforgeeks.org").href;
    }
  });

  if (!firstUrl) return [];

  const article = await crawl(firstUrl);
  if (!article.ok) return [];

  const cleaned = sanitize(article.html, article.url);

  return [
    {
      title: cleaned.title,
      url: article.url,
      text: cleaned.text,
    },
  ];
}