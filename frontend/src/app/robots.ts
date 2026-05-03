import type { MetadataRoute } from "next";
import { getBasePath, getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  const basePath = getBasePath();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        `${basePath}/agency`,
        `${basePath}/dashboard`,
        `${basePath}/settings`,
        `${basePath}/onboarding`,
        `${basePath}/billing`,
        `${basePath}/legal/`,
        `${basePath}/~offline`,
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
