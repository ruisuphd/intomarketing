/**
 * Public browser origin for canonical URLs, OG tags, sitemap, and robots.
 * Set NEXT_PUBLIC_SITE_URL in production (no trailing slash).
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}
