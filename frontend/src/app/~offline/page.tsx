import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline — IntoMarketing",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#f5f5f7] px-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">You are offline</h1>
        <p className="text-[15px] leading-relaxed text-[#1d1d1f]/70">
          IntoMarketing needs a network connection to load your workspace. Check your connection, then try again.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-[#0071e3] px-6 py-2.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
      >
        Back to home
      </Link>
    </main>
  );
}
