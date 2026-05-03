/**
 * Public browser origin for canonical URLs, OG tags, sitemap, and robots.
 * Set NEXT_PUBLIC_SITE_URL in production (no trailing slash).
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function getBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  if (!raw) return "";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
}

export function getAssetPath(path: `/${string}`): string {
  return `${getBasePath()}${path}`;
}
