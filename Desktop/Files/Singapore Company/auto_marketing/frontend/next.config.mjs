import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";
import { withSentryConfig } from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.NEXT_PUBLIC_API_URL?.trim()) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is required for production builds (see .env.example).",
  );
}

if (isProduction && !process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
  throw new Error(
    "NEXT_PUBLIC_SITE_URL is required for production builds (see .env.example).",
  );
}

function pwaRevision() {
  const out = spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8",
    maxBuffer: 64 * 1024,
  });
  const hash = out.stdout?.trim();
  if (hash) return hash;
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    "development"
  );
}

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: !isProduction,
  additionalPrecacheEntries: [{ url: "/~offline", revision: pwaRevision() }],
});

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Prevent clickjacking – also covered by frame-ancestors in CSP but belt-and-suspenders
  { key: "X-Frame-Options", value: "DENY" },
];

// ── Content-Security-Policy (Report-Only: monitor violations before enforcing) ─
// Switch key to "Content-Security-Policy" after 1 week of clean reports at /api/consent/csp-report
const _apiOrigin = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
const _cspDirectives = [
  "default-src 'self'",
  // 'unsafe-inline' required by Next.js hydration scripts and Sentry loader
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  [
    "connect-src 'self'",
    "https://*.sentry.io",
    "https://*.googleapis.com",
    "wss://*.googleapis.com",
    _apiOrigin,
  ]
    .filter(Boolean)
    .join(" "),
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com https://*.firebaseapp.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  `report-uri ${_apiOrigin || ""}/api/consent/csp-report`,
];
securityHeaders.push({
  key: "Content-Security-Policy-Report-Only",
  value: _cspDirectives.join("; "),
});

if (isProduction) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(withSerwist(nextConfig), {
  silent: true,
  disableLogger: true,
});
