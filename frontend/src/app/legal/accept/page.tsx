"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import Notice from "@/components/ui/notice";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { LEGAL_DOCS_VERSION } from "@/lib/legal-version";

function LegalAcceptInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError("Please confirm that you agree to the Terms and Privacy Policy.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await apiFetch("/api/legal/accept", {
        method: "POST",
        body: JSON.stringify({ version: LEGAL_DOCS_VERSION }),
      });
      router.replace(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? typeof err.detail === "object" &&
            err.detail !== null &&
            "error" in err.detail &&
            (err.detail as { error: string }).error === "legal_version_mismatch"
            ? "These terms were updated. Please refresh the page and try again."
            : err.message
          : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-apple-bg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-apple-text border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-apple-bg px-4 py-16">
      <div className="w-full max-w-lg rounded-apple bg-apple-card p-8 shadow-apple">
        <h1 className="text-2xl font-semibold text-apple-text">Accept terms</h1>
        <p className="mt-2 text-sm text-apple-secondary">
          Our Terms of Service and Privacy Policy were updated, or you need to confirm acceptance to
          continue using IntoMarketing (version {LEGAL_DOCS_VERSION}).
        </p>

        {error ? (
          <div className="mt-6">
            <Notice tone="danger">{error}</Notice>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-apple-border accent-apple-blue"
            />
            <span className="text-sm text-apple-text">
              I agree to the{" "}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-apple-blue hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-apple-blue hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-apple-blue py-3 text-[15px] font-medium text-white shadow-sm hover:bg-apple-blue-hover disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LegalAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-apple-bg">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-apple-text border-t-transparent" />
        </div>
      }
    >
      <LegalAcceptInner />
    </Suspense>
  );
}
