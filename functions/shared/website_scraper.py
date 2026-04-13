"""Lightweight website metadata scraper used during onboarding auto-fill."""

from __future__ import annotations

import re
from urllib.parse import urlparse

import httpx

from shared.logger import get_logger

logger = get_logger("website_scraper")

_MAX_BYTES = 50_000
_TIMEOUT = 8.0


def _extract_meta(html: str, name: str) -> str:
    """Extract content from <meta name="{name}" content="..."> or <meta property="{name}" ...>."""
    for pattern in [
        rf'<meta\s+name=["\']?{re.escape(name)}["\']?\s+content=["\']([^"\']*)["\']',
        rf'<meta\s+content=["\']([^"\']*)["\']?\s+name=["\']?{re.escape(name)}["\']',
        rf'<meta\s+property=["\']?{re.escape(name)}["\']?\s+content=["\']([^"\']*)["\']',
        rf'<meta\s+content=["\']([^"\']*)["\']?\s+property=["\']?{re.escape(name)}["\']',
    ]:
        m = re.search(pattern, html, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return ""


def _extract_h1(html: str) -> str:
    m = re.search(r"<h1[^>]*>([^<]+)</h1>", html, re.IGNORECASE)
    return m.group(1).strip() if m else ""


def _extract_title(html: str) -> str:
    m = re.search(r"<title[^>]*>([^<]+)</title>", html, re.IGNORECASE)
    return m.group(1).strip() if m else ""


async def scrape_website_metadata(url: str) -> dict:
    """Fetch a website and extract onboarding hints.

    Returns a dict with:
    - ``description_hint``: best available description text
    - ``industry_hint``: inferred from keywords (empty if not determinable)
    - ``target_audience_hint``: empty (requires human review)
    - ``title_hint``: page title or OG title
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return {"description_hint": "", "industry_hint": "", "target_audience_hint": "", "title_hint": ""}

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=_TIMEOUT,
            headers={"User-Agent": "IntoMarketing-Onboarding/1.0 (site preview)"},
        ) as client:
            resp = await client.get(url)
            html = resp.text[:_MAX_BYTES]
    except Exception as exc:
        logger.info("website_scraper.fetch_failed", extra={"url": url, "error": str(exc)})
        return {"description_hint": "", "industry_hint": "", "target_audience_hint": "", "title_hint": ""}

    og_desc = _extract_meta(html, "og:description")
    meta_desc = _extract_meta(html, "description")
    og_title = _extract_meta(html, "og:title")
    title = og_title or _extract_title(html)
    h1 = _extract_h1(html)

    description_hint = og_desc or meta_desc or h1 or ""
    title_hint = title or ""

    return {
        "description_hint": description_hint[:500],
        "title_hint": title_hint[:120],
        "industry_hint": "",
        "target_audience_hint": "",
    }
