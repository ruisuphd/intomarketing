"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CHANGELOG_VERSION } from "@/lib/changelog-version";

const CHANGELOG = [
  {
    date: "2025-03",
    items: [
      "Real-time chat streaming",
      "Regenerate now updates drafts in place",
      "AI feedback confirmation and disabled state",
      "Password change with clearer error messages",
      "Notification center in nav",
      "Command palette (⌘K)",
      "Lead activity timeline",
      "Usage meters for all 5 limits",
      "Invoice pagination",
      "File upload size validation",
      "Run pipeline now button",
    ],
  },
];

export default function ChangelogPage() {
  useEffect(() => {
    localStorage.setItem("intomarketing_changelog_last_seen", CHANGELOG_VERSION);
  }, []);

  return (
    <div className="min-h-screen bg-apple-bg">
      <header className="border-b border-apple-border bg-apple-card px-4 py-4">
        <Link href="/dashboard" className="text-sm font-medium text-apple-blue hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold">What&apos;s New</h1>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-8">
          {CHANGELOG.map((entry) => (
            <div key={entry.date}>
              <h2 className="mb-3 font-semibold text-apple-text">{entry.date}</h2>
              <ul className="list-disc space-y-1 pl-4 text-sm text-apple-secondary">
                {entry.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
