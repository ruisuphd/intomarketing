"""Calendar events API: unified view of scheduled drafts and newsletters."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from api.middleware.auth import require_access
from shared.datetime_utils import coerce_datetime
from shared.firestore_client import query_docs
from shared.models import TenantProfile

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/events")
async def list_calendar_events(
    tenant: TenantProfile = Depends(require_access("starter", "pro")),
):
    """Return scheduled drafts, newsletter campaigns, and pipeline calendar events."""
    drafts = query_docs(
        "drafts",
        filters=[("status", "==", "scheduled")],
        tenant_id=tenant.tenant_id,
        limit=100,
    )
    newsletter_campaigns = query_docs(
        "newsletter_campaigns",
        filters=[("status", "==", "scheduled")],
        tenant_id=tenant.tenant_id,
        limit=50,
    )
    # calendar_events are written by calendar_manager.py during the daily pipeline.
    # They represent outreach, newsletter, and other scheduled pipeline activities.
    pipeline_calendar_events = query_docs(
        "calendar_events",
        tenant_id=tenant.tenant_id,
        limit=100,
    )

    campaigns_by_date: dict[str, list[dict]] = {}
    for c in newsletter_campaigns:
        dt = coerce_datetime(c.get("scheduled_at"))
        if dt:
            date_str = dt.strftime("%Y-%m-%d")
            if date_str not in campaigns_by_date:
                campaigns_by_date[date_str] = []
            campaigns_by_date[date_str].append(
                {
                    "id": c.get("id"),
                    "type": "newsletter",
                    "subject": c.get("subject", ""),
                }
            )

    # Build a normalised list of pipeline calendar events for the frontend to merge.
    calendar_events_list: list[dict] = []
    for ev in pipeline_calendar_events:
        dt = coerce_datetime(ev.get("scheduled_for"))
        calendar_events_list.append(
            {
                "id": ev.get("id"),
                "type": ev.get("event_type", "pipeline"),
                "title": ev.get("title", ""),
                "scheduled_for": dt.isoformat() if dt else ev.get("scheduled_for"),
                "status": ev.get("status", "scheduled"),
                "reference_id": ev.get("reference_id"),
            }
        )

    return {
        "drafts": drafts,
        "newsletters_by_date": campaigns_by_date,
        "calendar_events": calendar_events_list,
    }
