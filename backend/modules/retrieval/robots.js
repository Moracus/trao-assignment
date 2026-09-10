import robotsParser from "robots-parser";

const cache = new Map();
const USER_AGENT = "NodeCrawler";

export async function isAllowed(url) {
  const target = new URL(url);
  const robotsUrl = `${target.origin}/robots.txt`;

  let robots = cache.get(target.origin);

  if (!robots) {
    try {
      const res = await fetch(robotsUrl, {
        headers: { "User-Agent": USER_AGENT }
      });

      const body = res.ok ? await res.text() : "";
      robots = robotsParser(robotsUrl, body);
    } catch {
      // If robots.txt can't be fetched, allow crawling.
      return true;
    }

    cache.set(target.origin, robots);
  }

  return robots.isAllowed(url, USER_AGENT);
}