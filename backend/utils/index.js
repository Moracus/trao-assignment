import jwt from "jsonwebtoken";
import crypto from "crypto";

export const createToken = (userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

export const normalizeJobDescription = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
};

export const getHostname = (url) => {
  return new URL(url).hostname.toLowerCase();
};

export const createDupHash = (companyUrl, jobDescription) => {
  const hostname = getHostname(companyUrl);
  const normalizedJD = normalizeJobDescription(jobDescription);

  const input = `${hostname}|${normalizedJD}`;

  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
};
