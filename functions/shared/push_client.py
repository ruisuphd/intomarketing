"""Browser push notification client using Web Push Protocol (RFC 8030) + VAPID."""

from __future__ import annotations

import json
import os
from typing import Any

from shared.firestore_client import query_docs
from shared.logger import get_logger
from shared.secrets import get_secret_or_env as get_secret

logger = get_logger("shared.push_client")

_VAPID_PRIVATE_KEY: str | None = None


def _get_vapid_private_key() -> str | None:
    global _VAPID_PRIVATE_KEY
    if _VAPID_PRIVATE_KEY:
        return _VAPID_PRIVATE_KEY
    try:
        _VAPID_PRIVATE_KEY = get_secret("push-vapid-private")
        return _VAPID_PRIVATE_KEY
    except Exception:
        return None


def send_push(
    tenant_id: str,
    title: str,
    body: str,
    section_id: str = "overview",
) -> None:
    """Fire-and-forget push notification to all subscriptions for a tenant.

    Failures are logged but never raised — push is non-critical.
    """
    try:
        from pywebpush import webpush, WebPushException  # type: ignore[import-untyped]
    except ImportError:
        logger.warning("pywebpush not installed; skipping push notification")
        return

    private_key = _get_vapid_private_key()
    if not private_key:
        logger.debug("VAPID private key not configured; skipping push notification")
        return

    vapid_claims = {"sub": "mailto:support@intonationlabs.com"}
    payload = json.dumps({"title": title, "body": body, "sectionId": section_id})

    subscriptions = query_docs(
        "push_subscriptions",
        tenant_id=tenant_id,
        limit=50,
    )

    sent = 0
    for sub in subscriptions:
        endpoint = sub.get("endpoint")
        keys = sub.get("keys") or {}
        p256dh = keys.get("p256dh")
        auth = keys.get("auth")
        if not (endpoint and p256dh and auth):
            continue
        try:
            webpush(
                subscription_info={"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}},
                data=payload,
                vapid_private_key=private_key,
                vapid_claims=vapid_claims,
                content_encoding="aes128gcm",
            )
            sent += 1
        except WebPushException as exc:
            status = getattr(exc.response, "status_code", None) if exc.response else None
            if status in (404, 410):
                # Subscription expired or unregistered — safe to ignore
                logger.debug("Push subscription expired for tenant %s: %s", tenant_id, endpoint[:30])
            else:
                logger.warning("Push send failed for tenant %s: %s", tenant_id, exc)
        except Exception as exc:
            logger.warning("Push send error for tenant %s: %s", tenant_id, exc)

    if sent:
        logger.info("Sent %d push notification(s) for tenant %s", sent, tenant_id)
