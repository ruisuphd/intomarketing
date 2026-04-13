"use client";

import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-apple-bg">
      <header className="border-b border-apple-border bg-apple-card px-4 py-4">
        <Link href="/dashboard" className="text-sm font-medium text-apple-blue hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Help &amp; Docs</h1>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6 text-sm text-apple-text">
          <p>
            IntoMarketing helps you automate marketing drafts, track market-style signals, and prioritise leads using AI.
          </p>
          <div id="capabilities">
            <h2 className="mb-2 font-semibold">Current capabilities</h2>
            <p className="mb-2 text-apple-secondary">
              The product evolves continuously. Today you get real draft generation, scheduling on the calendar, pipeline
              runs, and (where connected) OAuth for LinkedIn/X. Automated posting and live analytics from every network
              are still being wired up; until then, some dashboard metrics may be illustrative or incomplete.
            </p>
          </div>
          <div>
            <h2 className="mb-2 font-semibold">Getting started</h2>
            <ul className="list-disc space-y-1 pl-4">
              <li>Complete your company profile in Settings</li>
              <li>Connect LinkedIn or X in Settings when you want account-linked features</li>
              <li>Let the daily pipeline generate drafts and signals</li>
              <li>Review drafts, schedule on the calendar, and publish manually or via integrations as they roll out</li>
            </ul>
          </div>
          <div>
            <h2 className="mb-2 font-semibold">Need help?</h2>
            <p>
              Contact us at{" "}
              <a href="mailto:support@intomarketing.com" className="text-apple-blue hover:underline">
                support@intomarketing.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
