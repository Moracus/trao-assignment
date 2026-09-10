import { crawl } from "./crawler.js";
import { isAllowed } from "./robots.js";
import { sanitize } from "./sanitizer.js";
import { rankLinks } from "./ranking.js";

const MAX_PAGES = 5;

function classify(link) {
  const s = `${link.url} ${link.anchor}`.toLowerCase();

  if (s.includes("career") || s.includes("hiring")) return "hiring";
  if (s.includes("about")) return "about";
  if (s.includes("engineering")) return "engineering";
  if (s.includes("handbook")) return "handbook";
  return "page";
}

export async function retrieve(url) {
  const warnings = [];

  if (!(await isAllowed(url))) {
    return {
      ok: false,
      error: "Blocked by robots.txt",
      status: null,
      url,
    };
  }

  const home = await crawl(url);
  if (!home.ok) return home;

  const homepage = sanitize(home.html, home.url);
  const ranked = rankLinks(homepage.links);
  const topLinks = ranked.slice(0, MAX_PAGES);

  const pages = [
    {
      type: "homepage",
      url: home.url,
      title: homepage.title,
      text: homepage.text,
    },
  ];

  const results = await Promise.all(
    topLinks.map(async (link) => {
      try {
        if (!(await isAllowed(link.url))) {
          warnings.push(`Blocked by robots: ${link.url}`);
          return null;
        }

        const page = await crawl(link.url);
        if (!page.ok) {
          warnings.push(`${link.url}: ${page.error}`);
          return null;
        }

        const cleaned = sanitize(page.html, page.url);

        return {
          type: classify(link),
          url: page.url,
          title: cleaned.title,
          text: cleaned.text,
        };
      } catch {
        warnings.push(`Failed to crawl ${link.url}`);
        return null;
      }
    })
  );

  pages.push(...results.filter(Boolean));

  return {
    ok: true,
    pages,
    links: ranked,
    warnings,
  };
}