const KEYWORDS = {
  careers: 10,
  career: 10,
  hiring: 10,
  jobs: 8,
  join: 8,
  about: 6,
  handbook: 5,
  engineering: 4,
  culture: 3,
  blog: 1,
};

const NEGATIVE = [
  "pricing",
  "login",
  "signin",
  "signup",
  "privacy",
  "terms",
  "cookie",
  "contact",
];

const HIGH_PRIORITY_PATHS = [
  "/careers",
  "/career",
  "/jobs",
  "/join",
  "/join-us",
  "/work-with-us",
];

export function scoreLink(link) {
  const haystack = `${link.url} ${link.anchor}`.toLowerCase();
  const url = new URL(link.url);

  let score = 0;

  // keyword scoring
  for (const [word, value] of Object.entries(KEYWORDS)) {
    if (haystack.includes(word)) score += value;
  }

  // hard boost for careers-style paths
  if (HIGH_PRIORITY_PATHS.some((p) => url.pathname.startsWith(p))) {
    score += 20;
  }

  // penalties
  for (const word of NEGATIVE) {
    if (haystack.includes(word)) score -= 4;
  }

  // shallower URLs are generally better
  const depth = url.pathname.split("/").filter(Boolean).length;
  score -= Math.max(0, depth - 1);

  if (url.search) score -= 2;

  return score;
}

export function rankLinks(links) {
  return links
    .map((link) => ({
      ...link,
      score: scoreLink(link),
    }))
    .sort((a, b) => b.score - a.score);
}