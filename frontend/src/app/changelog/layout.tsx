import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Recent updates and improvements to IntoMarketing.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    url: `${getSiteUrl()}/changelog`,
    title: "Changelog — IntoMarketing",
  },
  twitter: {
    title: "Changelog — IntoMarketing",
  },
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
