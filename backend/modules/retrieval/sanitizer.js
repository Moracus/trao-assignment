import * as cheerio from "cheerio";

export function sanitize(html, baseUrl) {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, noscript, svg, nav, footer").remove();

  const title = $("title").text().trim() || null;

  const text = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000); // token budget

  const seen = new Set();
  const links = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const anchor = $(el).text().replace(/\s+/g, " ").trim();

    try {
      const absolute = new URL(href, baseUrl);

      // same origin only
      if (absolute.origin !== new URL(baseUrl).origin) return;

      // normalize trailing slash
      const normalized = absolute.href.replace(/\/$/, "");

      if (seen.has(normalized)) return;
      seen.add(normalized);

      links.push({
        url: normalized,
        anchor,
      });
    } catch {
      // ignore malformed links
    }
  });

  return { title, text, links };
}