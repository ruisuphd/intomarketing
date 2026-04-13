import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast";
import CookieConsentBanner from "@/components/cookie-consent";
import { getSiteUrl } from "@/lib/site-url";
import { APP_NAME, APP_FULL_NAME } from "@/lib/brand";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const APP_TITLE = `${APP_NAME} — AI Marketing Automation`;
const APP_DESCRIPTION =
  "AI-generated social drafts, market intelligence, and lead hints for B2B teams. Starter includes several scheduled generations per week; Pro adds a daily cadence and higher limits.";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: APP_NAME,
  title: {
    default: APP_TITLE,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    type: "website",
    siteName: APP_NAME,
    locale: "en",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: ["/og-default.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0071e3",
};

function JsonLd() {
  const base = getSiteUrl();
  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: APP_NAME,
        url: base,
        logo: `${base}/icon-512.png`,
      },
      {
        "@type": "WebSite",
        name: APP_NAME,
        url: base,
      },
    ],
  };
  return (
    <script type="application/ld+json">{JSON.stringify(payload)}</script>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans">
        <JsonLd />
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
