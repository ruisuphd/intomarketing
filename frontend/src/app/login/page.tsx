"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  verifyEmail,
} from "@/lib/firebase";
import { openCookiePreferences } from "@/lib/cookie-consent-storage";

const VALUE_POINTS = [
  {
    icon: "✦",
    title: "Scheduled drafts across 6 platforms",
    desc: "LinkedIn, X, Instagram, TikTok, Google Business, Xiaohongshu — cadence depends on your plan; Starter includes several generations per week, Pro adds daily runs.",
  },
  {
    icon: "◉",
    title: "Market intelligence on autopilot",
    desc: "Surfaces news, competitor signals, and intent-style hints from scheduled pipeline runs.",
  },
  {
    icon: "◈",
    title: "Lead hints & outreach drafts",
    desc: "Prioritise prospects and copy editable outreach drafts into your own tools.",
  },
];

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [sessionExpiredHint, setSessionExpiredHint] = useState(false);

  useEffect(() => {
    setSessionExpiredHint(
      typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("reason") === "session",
    );
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  const handleGoogle = async () => {
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google sign-in failed.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError("Failed to send reset email. Try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
        try {
          await verifyEmail();
        } catch {
          /* non-blocking */
        }
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError(
        e.code === "auth/user-not-found" || e.code === "auth/wrong-password"
          ? "Invalid email or password."
          : e.code === "auth/email-already-in-use"
            ? "An account with this email already exists."
            : e.code === "auth/weak-password"
              ? "Password must be at least 6 characters."
              : e.message || "Authentication failed."
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-apple-bg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-apple-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-apple-bg lg:flex-row">
      <div className="flex flex-col justify-center bg-[var(--color-surface)] border-b border-[var(--color-border-light)] px-6 pb-8 pt-10 lg:flex-1 lg:max-w-[50%] lg:border-b-0 lg:border-r lg:px-12 lg:py-12 lg:pt-16">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="IntoMarketing by Intonation Labs">
            <img
              src="/logo.png"
              alt=""
              className="h-8 w-8 rounded-lg object-contain"
            />
            <div className="flex flex-col">
              <span className="block text-[15px] font-semibold tracking-tight text-apple-text">IntoMarketing</span>
              <span className="mt-0.5 block text-[10px] font-medium tracking-tight text-apple-secondary sm:text-[11px]">by Intonation Labs</span>
            </div>
          </Link>
          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-apple-text sm:text-4xl">
            Your AI marketing team, working while you sleep.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-apple-secondary sm:text-lg">
            IntoMarketing generates social drafts on your plan&apos;s schedule, surfaces market-style signals and lead hints, and can email you a daily digest. Connect LinkedIn or X in Settings when you want account-linked features; review before you publish.
          </p>
          <ul className="mt-8 hidden space-y-4 lg:block">
            {VALUE_POINTS.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 text-lg text-apple-blue">{f.icon}</span>
                <div>
                  <p className="font-medium text-apple-text">{f.title}</p>
                  <p className="text-sm text-apple-secondary">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 hidden text-xs text-apple-secondary lg:block">
            Every account includes our Starter plan — free forever.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center bg-[var(--color-surface-alt)] px-4 py-8 lg:items-center lg:px-12 lg:py-12">
        <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-elevated)] p-8 shadow-sm dark:bg-[var(--color-surface-alt)]">
          <h2 className="text-xl font-semibold text-apple-text">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-apple-secondary">
            {mode === "signin" ? "Sign in to your workspace." : "Start your free account — no credit card required."}
          </p>

          {sessionExpiredHint ? (
            <div className="mt-4 rounded-apple-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Your session could not be validated. Please sign in again.
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-apple-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-apple-sm border border-apple-border bg-white py-2.5 text-sm font-medium text-apple-text shadow-apple transition-colors hover:bg-apple-bg disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.38-.31-2.18h-3.35c-.84 1.63-.84 3.75 0 5.38l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-apple-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-apple-card px-3 text-xs text-apple-secondary">or continue with email</span>
            </div>
          </div>

          {forgotMode && resetSent ? (
            <div className="mt-2 text-center">
              <p className="rounded-apple-sm border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Reset link sent! Check your inbox.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setResetSent(false);
                  setError("");
                }}
                className="mt-4 text-sm text-apple-blue hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : forgotMode && !resetSent ? (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <p className="text-sm text-apple-secondary">Enter your email to receive a password reset link.</p>
              <input
                type="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-apple-sm border border-apple-border bg-white px-3 py-2.5 text-sm text-apple-text placeholder:text-apple-secondary focus:border-apple-blue focus:outline-none focus:ring-1 focus:ring-apple-blue"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-apple-sm bg-apple-blue py-2.5 text-sm font-medium text-white transition-colors hover:bg-apple-blue-hover disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send reset link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setError("");
                }}
                className="w-full text-sm text-apple-blue hover:underline"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmail} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-apple-secondary">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-apple-sm border border-apple-border bg-white px-3 py-2.5 text-sm text-apple-text placeholder:text-apple-secondary focus:border-apple-blue focus:outline-none focus:ring-1 focus:ring-apple-blue"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-apple-secondary">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-apple-sm border border-apple-border bg-white px-3 py-2.5 text-sm text-apple-text placeholder:text-apple-secondary focus:border-apple-blue focus:outline-none focus:ring-1 focus:ring-apple-blue"
                />
              </div>
              {mode === "signin" ? (
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError("");
                  }}
                  className="text-xs text-apple-blue hover:underline"
                >
                  Forgot password?
                </button>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-apple-sm bg-apple-blue py-2.5 text-sm font-medium text-white transition-colors hover:bg-apple-blue-hover disabled:opacity-50"
              >
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-apple-secondary">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className="font-medium text-apple-blue hover:underline"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                  className="font-medium text-apple-blue hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="mt-6 text-center text-xs text-apple-secondary">
            By continuing, you agree to IntoMarketing&apos;s{" "}
            <a href="/terms" className="underline hover:text-apple-text">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-apple-text">
              Privacy Policy
            </a>
            .{" "}
            <button type="button" onClick={() => openCookiePreferences()} className="underline hover:text-apple-text">
              Cookie preferences
            </button>
          </p>

          <p className="mt-6 text-center text-sm">
            <Link href="/" className="text-apple-secondary hover:text-apple-text">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
