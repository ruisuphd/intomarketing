import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agency (preview)",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
