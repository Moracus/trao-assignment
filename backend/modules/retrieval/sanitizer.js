import * as cheerio from "cheerio";

export function sanitize(html, baseUrl) {
  const $ = cheerio.load(html);

  const title = $("title").text().trim() || null;

  // -------- PASS 1: Extract links BEFORE removing footer/nav --------
  const seen = new Set();
  const links = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const anchor = $(el).text().replace(/\s+/g, " ").trim();

    try {
      const absolute = new URL(href, baseUrl);

      // only crawl same origin
      if (absolute.origin !== new URL(baseUrl).origin) return;

      // remove hash + normalize trailing slash
      absolute.hash = "";
      const normalized = absolute.href.replace(/\/$/, "");

      if (seen.has(normalized)) return;
      seen.add(normalized);

      links.push({
        url: normalized,
        anchor,
      });
    } catch {
      // ignore malformed URLs
    }
  });

  // -------- PASS 2: Clean DOM ONLY for text extraction --------
  $("script, style, noscript, svg, nav, footer").remove();

  const text = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);

  return { title, text, links };
}