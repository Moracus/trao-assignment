// ranking.js

const KEYWORDS = {
  careers: 10,
  hiring: 10,
  jobs: 8,
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

export function scoreLink(link) {
  const haystack = `${link.url} ${link.anchor}`.toLowerCase();

  let score = 0;

  for (const [word, value] of Object.entries(KEYWORDS)) {
    if (haystack.includes(word)) score += value;
  }

  for (const word of NEGATIVE) {
    if (haystack.includes(word)) score -= 4;
  }

  const url = new URL(link.url);

  // Prefer shallower URLs
  const depth = url.pathname.split("/").filter(Boolean).length;
  score -= Math.max(0, depth - 1);

  // Slight penalty for query params
  if (url.search) score -= 2;

  return score;
}

export function rankLinks(links) {
  return links
    .map(link => ({
      ...link,
      score: scoreLink(link),
    }))
    .sort((a, b) => b.score - a.score);
}