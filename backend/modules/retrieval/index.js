import { crawl } from "./crawler.js";
import { isAllowed } from "./robots.js";
import { sanitize } from "./sanitizer.js";
import { rankLinks } from "./ranking.js";
import { crawlPublicDiscussion } from "./public.js"; // NEW

const MAX_OFFICIAL_PAGES = 5;

function classify(link) {
  const s = `${link.url} ${link.anchor}`.toLowerCase();

  if (s.includes("career") || s.includes("hiring") || s.includes("job"))
    return "hiring";
  if (s.includes("about")) return "about";
  if (s.includes("engineering")) return "engineering";
  if (s.includes("handbook")) return "handbook";

  return "page";
}

export async function retrieve(url) {
  const warnings = [];

  // ---------- ROBOTS ----------
  if (!(await isAllowed(url))) {
    return {
      ok: false,
      error: "Blocked by robots.txt",
      status: null,
      url,
    };
  }

  // ---------- HOMEPAGE ----------
  const home = await crawl(url);
  if (!home.ok) return home;

  const homepage = sanitize(home.html, home.url);
  const ranked = rankLinks(homepage.links);
  const topLinks = ranked.slice(0, MAX_OFFICIAL_PAGES);

  const companyName =
    homepage.title?.split("|")[0]?.split("–")[0]?.trim() ||
    new URL(home.url).hostname.replace("www.", "").split(".")[0];

  // ---------- BRANCH 1 : OFFICIAL ----------
  const officialPromise = Promise.all(
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

  // ---------- BRANCH 2 : PUBLIC ----------
  const publicPromise = crawlPublicDiscussion(companyName).catch(() => {
    warnings.push("Public discussion retrieval failed");
    return [];
  });

  const [officialPages, publicPages] = await Promise.all([
    officialPromise,
    publicPromise,
  ]);

  // ---------- APPENDIX A SHAPE ----------
  const pages = [
    {
      type: "homepage",
      url: home.url,
      title: homepage.title,
      text: homepage.text,
    },

    ...officialPages.filter(Boolean),

    ...publicPages.map((doc) => ({
      type: "interview/public", // new page type
      url: doc.url,
      title: doc.title,
      text: doc.text,
    })),
  ];

  return {
    ok: true,
    pages,
    links: ranked,
    warnings,
  };
}

// console.log(await retrieve("https://uber.com"));