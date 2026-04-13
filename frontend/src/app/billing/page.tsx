"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Canonical billing URL for Stripe return links and in-app navigation.
 * Forwards to Settings with the billing tab and preserves ?checkout= success/canceled.
 */
function BillingForward() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const next = new URLSearchParams();
    next.set("tab", "billing");
    if (checkout) next.set("checkout", checkout);
    router.replace(`/settings?${next.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-apple-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-apple-text border-t-transparent" />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-apple-bg">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-apple-text border-t-transparent" />
        </div>
      }
    >
      <BillingForward />
    </Suspense>
  );
}
