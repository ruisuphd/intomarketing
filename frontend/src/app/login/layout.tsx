import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to IntoMarketing — AI-generated drafts, market intelligence, and lead hints for B2B teams.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    url: `${getSiteUrl()}/login`,
    title: "Sign in — IntoMarketing",
  },
  twitter: {
    title: "Sign in — IntoMarketing",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
