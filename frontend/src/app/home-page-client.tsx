"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getAssetPath } from "@/lib/site-url";

const FEATURES = [
  {
    icon: "✦",
    title: "Drafts for 6 platforms",
    desc: "LinkedIn, X, Instagram, TikTok, Google Business, and Xiaohongshu variants — generated on your schedule. One-click auto-publish is rolling out as we connect each network.",
  },
  {
    icon: "◉",
    title: "Market intelligence on autopilot",
    desc: "Surfaces news, competitor signals, and intent-style hints from your pipeline so you can react quickly.",
  },
  {
    icon: "◈",
    title: "Lead hints & outreach drafts",
    desc: "Surfaces prospects to prioritise and drafts messages you can copy, edit, and send from your own tools.",
  },
];

const STEPS = [
  { n: "1", title: "Connect your brand", body: "Tell us your company, voice, and where you show up online." },
  {
    n: "2",
    title: "Pipeline runs on a schedule",
    body: "Drafts, signals, and lead hints are produced on a cadence that matches your plan while you focus on closing.",
  },
  {
    n: "3",
    title: "Review and publish",
    body: "Use the dashboard for drafts and your daily email digest; publish from the app as integrations go live, or copy out today.",
  },
];

export default function HomePageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen flex-col bg-apple-bg">
        <div className="h-14 border-b border-apple-border bg-apple-card" />
        <div className="flex flex-1 items-center justify-center" role="status" aria-label="Loading">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-apple-border border-t-apple-blue" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-apple-bg text-apple-text">
      <header className="sticky top-0 z-50 border-b border-apple-border bg-apple-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="IntoMarketing by Intonation Labs">
            <Image
              src={getAssetPath("/logo.png")}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
            />
            <div className="flex flex-col">
              <span className="block text-[15px] font-semibold tracking-tight text-apple-text">IntoMarketing</span>
              <span className="mt-0.5 block text-[10px] font-medium tracking-tight text-apple-secondary sm:text-[11px]">by Intonation Labs</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-apple-secondary transition-colors hover:text-apple-text"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-apple-blue px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-apple-blue-hover active:scale-[0.98]"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pb-20 sm:pt-20 lg:pt-24">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl md:leading-[1.08]">
            Your AI marketing team,
            <br />
            working while you sleep.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-apple-secondary sm:text-xl">
            Scheduled draft packs, market signals, lead hints, and a daily email digest — built for B2B teams. Pro adds
            newsletter generation and a daily content cadence. See{" "}
            <Link href="/help#capabilities" className="text-apple-blue underline hover:opacity-90">
              what ships today
            </Link>
            .
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
            <Link
              href="/login"
              className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full bg-apple-blue px-8 text-base font-medium text-white shadow-sm transition hover:bg-apple-blue-hover active:scale-[0.98]"
            >
              Get started free
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full border border-apple-border bg-transparent px-8 text-base font-medium text-apple-text transition-colors hover:bg-white"
            >
              See how it works
            </a>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-xs leading-relaxed text-apple-secondary">
            AI-generated content and insights can be inaccurate. Review important posts and decisions before publishing.{" "}
            <Link href="/terms" className="text-apple-blue underline hover:opacity-90">
              Terms
            </Link>
          </p>
        </section>

        <section id="how-it-works" className="border-t border-apple-border bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold sm:text-3xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-apple-secondary">
              One workspace for content, intelligence, and outreach — without hiring a full marketing department.
            </p>
            <ol className="mx-auto mt-12 grid max-w-3xl gap-8 sm:grid-cols-3 sm:gap-6">
              {STEPS.map((s) => (
                <li key={s.n} className="text-center sm:text-left">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-apple-bg text-sm font-semibold text-apple-blue">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-apple-secondary">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">What you get</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-apple-secondary">
            Everything in one place — from drafts to signals to leads.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-apple-border bg-white p-8 shadow-apple transition hover:shadow-apple-lg"
              >
                <span className="text-xl text-apple-blue">{f.icon}</span>
                <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-apple-secondary">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-apple-border bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="text-xl font-semibold sm:text-2xl">Simple pricing</h2>
            <p className="mt-4 text-apple-secondary">
              Every account includes our <span className="font-medium text-apple-text">Starter</span> plan — free forever.
              Upgrade when you need more volume or seats.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-apple-blue px-8 text-sm font-medium text-white transition hover:bg-apple-blue-hover"
            >
              Create free account
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-2xl font-semibold sm:text-3xl">Ready to automate your marketing?</h2>
          <p className="mt-4 text-apple-secondary">No credit card required to start.</p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-apple-blue px-8 text-base font-medium text-white transition hover:bg-apple-blue-hover"
          >
            Get started free
          </Link>
        </section>
      </main>

      <footer className="border-t border-apple-border py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-sm sm:px-6">
          <Link href="/help" className="text-apple-secondary hover:text-apple-text hover:underline">
            Help
          </Link>
          <Link href="/terms" className="text-apple-secondary hover:text-apple-text hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="text-apple-secondary hover:text-apple-text hover:underline">
            Privacy
          </Link>
          <Link href="/login" className="font-medium text-apple-blue hover:underline">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
