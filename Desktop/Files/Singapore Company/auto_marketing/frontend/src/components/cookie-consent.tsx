"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  type CookieConsent,
  getStoredConsent,
  saveStoredConsent,
  OPEN_COOKIE_PREFERENCES_EVENT,
  CONSENT_VERSION,
} from "@/lib/cookie-consent-storage";

export {
  readAnalyticsConsent,
  readMarketingConsent,
  hasAnalyticsConsent,
  openCookiePreferences,
} from "@/lib/cookie-consent-storage";

type UiMode = "hidden" | "banner" | "dialog";

function ConsentPanel(props: {
  variant: "banner" | "dialog";
  showPrefs: boolean;
  analytics: boolean;
  marketing: boolean;
  onAnalyticsChange: (v: boolean) => void;
  onMarketingChange: (v: boolean) => void;
  onAcceptAll: () => void;
  onSavePreferences: () => void;
  onRejectNonEssential: () => void;
  onManagePreferences: () => void;
  onClose?: () => void;
}) {
  const {
    variant,
    showPrefs,
    analytics,
    marketing,
    onAnalyticsChange,
    onMarketingChange,
    onAcceptAll,
    onSavePreferences,
    onRejectNonEssential,
    onManagePreferences,
    onClose,
  } = props;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-heading"
      className={
        variant === "dialog"
          ? "mx-4 w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-2xl"
          : "mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-2xl"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="cookie-consent-heading" className="text-base font-semibold text-gray-900">
          Cookie preferences
        </h2>
        {variant === "dialog" && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close without saving"
          >
            Close
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-700">
        We use cookies to ensure the app works properly and to improve your experience.{" "}
        <Link href="/privacy" className="text-blue-600 underline hover:text-blue-800">
          Privacy Policy
        </Link>
      </p>

      {showPrefs && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <label className="flex cursor-default items-start gap-3 text-sm">
            <input type="checkbox" checked disabled className="mt-0.5 rounded border-gray-300" />
            <span>
              <strong>Essential</strong>
              <span className="block text-xs text-gray-500 mt-0.5">
                Required for login, session management, and security features.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => onAnalyticsChange(e.target.checked)}
              className="mt-0.5 rounded border-gray-300"
            />
            <span>
              <strong>Analytics</strong>
              <span className="block text-xs text-gray-500 mt-0.5">
                Error tracking via Sentry to improve reliability. No advertising profiles are built.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => onMarketingChange(e.target.checked)}
              className="mt-0.5 rounded border-gray-300"
            />
            <span>
              <strong>Marketing</strong>
              <span className="block text-xs text-gray-500 mt-0.5">
                Currently inactive — reserved for future use.
              </span>
            </span>
          </label>
          <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">
            Your data is processed and stored in Singapore (GCP region: asia-southeast1) in
            compliance with the Personal Data Protection Act 2012 (PDPA). In the event of a
            confirmed data breach, we will notify affected users within 3 business days.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAcceptAll}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Accept All
        </button>
        {showPrefs ? (
          <button
            type="button"
            onClick={onSavePreferences}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Save Preferences
          </button>
        ) : (
          <button
            type="button"
            onClick={onManagePreferences}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Manage Preferences
          </button>
        )}
        <button
          type="button"
          onClick={onRejectNonEssential}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reject Non-Essential
        </button>
      </div>
    </div>
  );
}

export default function CookieConsentBanner() {
  const [uiMode, setUiMode] = useState<UiMode>("hidden");
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const closeUi = useCallback(() => {
    setUiMode("hidden");
    setShowPrefs(false);
  }, []);

  const accept = useCallback(
    (consent: CookieConsent) => {
      const withVersion: CookieConsent = { ...consent, version: CONSENT_VERSION };
      saveStoredConsent(withVersion);
      // Fire-and-forget: record consent server-side for GDPR/PDPA audit trail.
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        fetch(`${apiUrl}/api/consent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: CONSENT_VERSION,
            analytics: withVersion.analytics,
            marketing: withVersion.marketing,
          }),
        }).catch(() => {
          // Non-blocking — consent is already saved locally.
        });
      }
      closeUi();
    },
    [closeUi],
  );

  useEffect(() => {
    if (!getStoredConsent()) setUiMode("banner");
  }, []);

  useEffect(() => {
    const onOpen = () => {
      const c = getStoredConsent();
      if (c) {
        setAnalytics(c.analytics);
        setMarketing(c.marketing);
        setShowPrefs(true);
        setUiMode("dialog");
      } else {
        setAnalytics(false);
        setMarketing(false);
        setShowPrefs(false);
        setUiMode("banner");
      }
    };
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, onOpen);
  }, []);

  if (uiMode === "hidden") return null;

  const panel = (
    <ConsentPanel
      variant={uiMode}
      showPrefs={showPrefs}
      analytics={analytics}
      marketing={marketing}
      onAnalyticsChange={setAnalytics}
      onMarketingChange={setMarketing}
      onAcceptAll={() =>
        accept({
          essential: true,
          analytics: true,
          marketing: true,
          timestamp: new Date().toISOString(),
          version: CONSENT_VERSION,
        })
      }
      onSavePreferences={() =>
        accept({
          essential: true,
          analytics,
          marketing,
          timestamp: new Date().toISOString(),
          version: CONSENT_VERSION,
        })
      }
      onRejectNonEssential={() =>
        accept({
          essential: true,
          analytics: false,
          marketing: false,
          timestamp: new Date().toISOString(),
          version: CONSENT_VERSION,
        })
      }
      onManagePreferences={() => setShowPrefs(true)}
      onClose={uiMode === "dialog" ? closeUi : undefined}
    />
  );

  if (uiMode === "banner") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40" aria-hidden />
        <div className="relative p-4 pb-6">{panel}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div className="relative z-10 flex w-full justify-center">{panel}</div>
    </div>
  );
}
