export function sanitizeCompanyUrl(rawValue) {
  if (typeof rawValue !== "string") {
    return {
      ok: false,
      value: "",
      message: "Please enter a valid company URL.",
    };
  }

  let value = rawValue.trim();
  value = value.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim();
  value = value.replace(/\s+/g, "");

  if (!value) {
    return {
      ok: false,
      value: "",
      message: "Company URL is required.",
    };
  }

  const looksLikeProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(value);
  const candidate = looksLikeProtocol ? value : `http://${value}`;

  try {
    const parsed = new URL(candidate);
    const protocol = parsed.protocol === "https:" ? "http:" : parsed.protocol;

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Unsupported scheme");
    }

    if (!parsed.hostname) {
      throw new Error("Missing hostname");
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (!hostname || hostname.includes(" ")) {
      throw new Error("Invalid hostname");
    }

    const pathname = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname.replace(/\/+$/, "") : "";
    const search = parsed.search || "";
    const port = parsed.port ? `:${parsed.port}` : "";

    return {
      ok: true,
      value: `${protocol}//${hostname}${port}${pathname}${search}`,
      message: "",
    };
  } catch {
    return {
      ok: false,
      value: "",
      message: "Please enter a valid company URL, such as xyz.com or https://xyz.com.",
    };
  }
}

export function getErrorMessage(error, fallback = "Something went wrong.") {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
}
