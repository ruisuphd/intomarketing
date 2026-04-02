import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/agency",
        "/dashboard",
        "/settings",
        "/onboarding",
        "/billing",
        "/legal/",
        "/~offline",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
