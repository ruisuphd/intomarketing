import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Help & capabilities",
  description:
    "What IntoMarketing does today: draft generation, scheduling, pipeline runs, LinkedIn/X OAuth, and how publishing integrations are rolling out.",
  alternates: {
    canonical: "/help",
  },
  openGraph: {
    url: `${getSiteUrl()}/help`,
    title: "Help & capabilities — IntoMarketing",
  },
  twitter: {
    title: "Help & capabilities — IntoMarketing",
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
