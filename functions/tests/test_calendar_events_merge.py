"""Calendar events: verify merged response includes drafts, newsletters, and calendar_events."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from api.routes import calendar as calendar_mod
from shared.models import TenantProfile


def _tenant() -> TenantProfile:
    return TenantProfile.model_validate(
        {
            "tenant_id": "tenant-cal",
            "owner_uid": "uid-cal",
            "owner_email": "owner@example.com",
            "company_name": "CalCo",
            "industry": "Tech",
            "description": "d",
            "subscription_tier": "starter",
            "subscription_status": "active",
            "created_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
        }
    )


@pytest.mark.asyncio
async def test_calendar_returns_all_three_keys(monkeypatch):
    """Response must always have drafts, newsletters_by_date, and calendar_events."""
    monkeypatch.setattr(calendar_mod, "query_docs", lambda *a, **kw: [])

    result = await calendar_mod.list_calendar_events(tenant=_tenant())

    assert "drafts" in result
    assert "newsletters_by_date" in result
    assert "calendar_events" in result


@pytest.mark.asyncio
async def test_calendar_events_included_from_pipeline(monkeypatch):
    """Pipeline calendar_events must appear in the calendar_events list."""
    now = datetime(2026, 4, 15, 9, 0, tzinfo=timezone.utc)

    def fake_query(collection, *args, **kwargs):
        if collection == "drafts":
            return []
        if collection == "newsletter_campaigns":
            return []
        if collection == "calendar_events":
            return [
                {
                    "id": "cal-1",
                    "event_type": "outreach",
                    "title": "Follow-up call",
                    "scheduled_for": now,
                    "status": "scheduled",
                    "reference_id": "lead-123",
                }
            ]
        return []

    monkeypatch.setattr(calendar_mod, "query_docs", fake_query)

    result = await calendar_mod.list_calendar_events(tenant=_tenant())

    assert len(result["calendar_events"]) == 1
    ev = result["calendar_events"][0]
    assert ev["id"] == "cal-1"
    assert ev["type"] == "outreach"
    assert ev["title"] == "Follow-up call"


@pytest.mark.asyncio
async def test_calendar_drafts_included(monkeypatch):
    """Scheduled drafts must be present in the drafts list."""
    def fake_query(collection, *args, **kwargs):
        if collection == "drafts":
            return [{"id": "draft-1", "status": "scheduled", "headline": "Test post"}]
        return []

    monkeypatch.setattr(calendar_mod, "query_docs", fake_query)

    result = await calendar_mod.list_calendar_events(tenant=_tenant())

    assert len(result["drafts"]) == 1
    assert result["drafts"][0]["id"] == "draft-1"


@pytest.mark.asyncio
async def test_calendar_newsletter_grouped_by_date(monkeypatch):
    """Newsletter campaigns must be grouped by date in newsletters_by_date."""
    day = datetime(2026, 4, 20, 10, 0, tzinfo=timezone.utc)

    def fake_query(collection, *args, **kwargs):
        if collection == "newsletter_campaigns":
            return [
                {"id": "nl-1", "status": "scheduled", "subject": "April Update", "scheduled_at": day},
            ]
        return []

    monkeypatch.setattr(calendar_mod, "query_docs", fake_query)

    result = await calendar_mod.list_calendar_events(tenant=_tenant())

    assert "2026-04-20" in result["newsletters_by_date"]
    campaigns = result["newsletters_by_date"]["2026-04-20"]
    assert len(campaigns) == 1
    assert campaigns[0]["subject"] == "April Update"
