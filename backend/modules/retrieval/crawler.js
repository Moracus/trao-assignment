// crawler.js

const DEFAULTS = {
  timeout: 8000, // 8 seconds
  maxSize: 5 * 1024 * 1024, // 5MB
  userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://google.com)",
};

/**
 * Crawl a URL and return HTML, status, and final URL.
 * Never throws for expected crawl failures.
 *
 * @param {string} inputUrl
 * @param {{ timeout?: number, maxSize?: number }} options
 * @returns {Promise<
 *   | { ok: true, html: string, status: number, url: string }
 *   | { ok: false, error: string, status: number|null, url: string|null }
 * >}
 */
export async function crawl(inputUrl, options = {}) {
  const config = { ...DEFAULTS, ...options };

  // Validate URL
  let parsed;
  try {
    parsed = new URL(inputUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return {
        ok: false,
        error: "Only HTTP/HTTPS URLs are allowed",
        status: null,
        url: null,
      };
    }
  } catch {
    return {
      ok: false,
      error: "Invalid URL",
      status: null,
      url: null,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeout);

  try {
    const res = await fetch(parsed, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": config.userAgent,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const finalUrl = new URL(res.url);

    // Block redirects to non-http(s)
    if (!["http:", "https:"].includes(finalUrl.protocol)) {
      return {
        ok: false,
        error: "Redirected to an unsupported protocol",
        status: res.status,
        url: res.url,
      };
    }

    // HTML only
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("html")) {
      return {
        ok: false,
        error: `Unsupported content type: ${contentType || "unknown"}`,
        status: res.status,
        url: res.url,
      };
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return {
        ok: false,
        error: "Empty response body",
        status: res.status,
        url: res.url,
      };
    }

    const chunks = [];
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      total += value.byteLength;

      if (total > config.maxSize) {
        console.log("size limit exceeded");
        await reader.cancel();
        return {
          ok: false,
          error: "Response exceeds max size limit",
          status: res.status,
          url: res.url,
        };
      }

      chunks.push(value);
    }

    return {
      ok: true,
      html: Buffer.concat(chunks).toString("utf8"),
      status: res.status,
      url: res.url,
    };
  } catch (err) {
    console.log("Error crawling", err);
    return {
      ok: false,
      error:
        err.name === "AbortError"
          ? "Request timed out"
          : err.cause?.code === "ENOTFOUND"
            ? `DNS lookup failed for ${err.cause.hostname}`
            : err.message,
      status: null,
      url: null,
    };
  } finally {
    clearTimeout(timer);
  }
}
