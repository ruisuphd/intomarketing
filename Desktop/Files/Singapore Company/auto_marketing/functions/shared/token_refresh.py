"""Helpers for refreshing platform OAuth tokens before publishing."""

from __future__ import annotations

import base64
from datetime import datetime, timezone
from typing import Optional

import httpx

from shared.logger import get_logger

logger = get_logger("token_refresh")

_X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token"


async def refresh_x_token(
    client_id: str,
    client_secret: str,
    refresh_token: str,
) -> dict | None:
    """Exchange an X (Twitter) refresh token for a fresh access token.

    Returns a dict with ``access_token``, ``refresh_token``, and ``expires_in``
    on success, or ``None`` if the refresh fails.
    """
    credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                _X_TOKEN_URL,
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
            )
            if resp.status_code != 200:
                logger.warning(
                    "token_refresh.x_failed",
                    extra={"status": resp.status_code, "body": resp.text[:200]},
                )
                return None
            data = resp.json()
            # Convert relative expires_in (seconds) to absolute UTC timestamp
            expires_in = data.get("expires_in")
            if expires_in is not None:
                from datetime import timedelta
                data["expires_at"] = (
                    datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
                ).isoformat()
            return data
    except Exception as exc:
        logger.warning("token_refresh.x_error", extra={"error": str(exc)})
        return None


def is_token_expired(expires_at: Optional[datetime], buffer_seconds: int = 120) -> bool:
    """Return True if the token has expired (or will expire within buffer_seconds)."""
    if expires_at is None:
        return False
    now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return (expires_at - now).total_seconds() < buffer_seconds
