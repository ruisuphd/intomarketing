export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

export const STORAGE_KEY = "cookie_consent";

/**
 * Bump this string whenever the cookie policy changes significantly.
 * Any stored consent with a different version is treated as missing,
 * forcing the user to re-consent.
 */
export const CONSENT_VERSION = "2026-04-01";

export const OPEN_COOKIE_PREFERENCES_EVENT = "intomarketing:open-cookie-preferences";
export const COOKIE_CONSENT_UPDATED_EVENT = "intomarketing:cookie-consent-updated";

const LEGACY_CONSENT_COOKIE = "cc_consent";

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

/** Optional server-readable hint: analytics allowed (1) or not (0). Secure on HTTPS. */
function syncAnalyticsCookie(analytics: boolean) {
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  const v = analytics ? "1" : "0";
  document.cookie = `cc_analytics=${v}; path=/; max-age=31536000; SameSite=Lax${secure}`;
}

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    // If the stored consent is from an older policy version, treat it as absent
    // so the banner re-appears and the user can re-consent.
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readAnalyticsConsent(): boolean {
  return getStoredConsent()?.analytics === true;
}

export function readMarketingConsent(): boolean {
  return getStoredConsent()?.marketing === true;
}

/** @deprecated use readAnalyticsConsent */
export function hasAnalyticsConsent(): boolean {
  return readAnalyticsConsent();
}

export function saveStoredConsent(consent: CookieConsent) {
  if (typeof window === "undefined") return;
  // Always stamp the current policy version so version checks stay consistent.
  const withVersion: CookieConsent = { ...consent, version: CONSENT_VERSION };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withVersion));
  deleteCookie(LEGACY_CONSENT_COOKIE);
  syncAnalyticsCookie(withVersion.analytics);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT));
}

export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFERENCES_EVENT));
}
