"""Shared competitor signal lookup for dashboard, email brief, and pipeline."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from shared.datetime_utils import coerce_datetime
from shared.firestore_client import add_doc, query_docs


def get_top_competitor_signal(tenant_id: str | None) -> dict[str, Any] | None:
    """Return the strongest competitor-tagged intelligence item from the last 24 hours."""
    if not tenant_id:
        return None
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(hours=24)
    items = query_docs(
        "intelligence_items",
        filters=[("competitor_id", "!=", None)],
        tenant_id=tenant_id,
        limit=20,
    )
    recent = [
        item
        for item in items
        if (coerce_datetime(item.get("gathered_at")) or datetime.min.replace(tzinfo=timezone.utc))
        >= day_ago
    ]
    if not recent:
        return None
    top = max(recent, key=lambda x: x.get("postability_score", 0))
    return {
        "title": top.get("title") or top.get("headline") or "New competitor activity",
        "source_name": top.get("source_name") or top.get("competitor_name") or "Competitor",
        "postability_score": top.get("postability_score", 0),
        "summary": (top.get("summary") or "")[:400],
    }


def record_competitor_alert_if_needed(tenant_id: str, item_dict: dict) -> None:
    """Persist an unacknowledged alert when an intelligence item is competitor-tagged."""
    cid = item_dict.get("competitor_id")
    if not cid or not tenant_id:
        return
    add_doc(
        "competitor_alerts",
        {
            "competitor_id": cid,
            "title": item_dict.get("title") or item_dict.get("headline") or "Competitor activity",
            "source_name": item_dict.get("source_name") or "",
            "summary": (item_dict.get("summary") or "")[:500],
            "gathered_at": item_dict.get("gathered_at"),
            "acknowledged": False,
        },
        tenant_id=tenant_id,
    )
