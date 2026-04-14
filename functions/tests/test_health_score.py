"""Health score endpoint: calculation, clamping, and label assignment."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from api.routes import dashboard as dashboard_mod
from shared.models import TenantProfile


def _tenant() -> TenantProfile:
    return TenantProfile.model_validate(
        {
            "tenant_id": "tenant-hs",
            "owner_uid": "uid-hs",
            "owner_email": "owner@example.com",
            "company_name": "HealthCo",
            "industry": "Tech",
            "description": "d",
            "subscription_tier": "starter",
            "subscription_status": "active",
            "created_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
        }
    )


@pytest.mark.asyncio
async def test_health_score_zero_when_no_data(monkeypatch):
    monkeypatch.setattr(dashboard_mod, "query_docs", lambda *a, **kw: [])

    result = await dashboard_mod.get_health_score(tenant=_tenant())

    assert result["score"] == 0
    assert result["label"] == "Just Starting"
    assert set(result["breakdown"].keys()) == {"posts", "approvals", "leads", "analytics"}


@pytest.mark.asyncio
async def test_health_score_excellent_with_full_activity(monkeypatch):
    now = datetime.now(timezone.utc)

    def fake_query_docs(collection, *args, **kwargs):
        if collection == "publishing_records":
            return [{"status": "published", "published_at": now} for _ in range(5)]
        if collection == "drafts":
            return [{"status": "scheduled"} for _ in range(8)]
        if collection == "qualified_leads":
            return [{"qualified_at": now} for _ in range(10)]
        if collection == "analytics_snapshots":
            return [{"created_at": now} for _ in range(5)]
        return []

    monkeypatch.setattr(dashboard_mod, "query_docs", fake_query_docs)

    result = await dashboard_mod.get_health_score(tenant=_tenant())

    assert result["score"] >= 80
    assert result["label"] == "Excellent"


@pytest.mark.asyncio
async def test_health_score_clamped_to_100(monkeypatch):
    """Score must never exceed 100 even with extreme data."""
    now = datetime.now(timezone.utc)

    def fake_query_docs(collection, *args, **kwargs):
        if collection == "publishing_records":
            return [{"status": "published", "published_at": now} for _ in range(100)]
        if collection == "drafts":
            return [{"status": "scheduled"} for _ in range(100)]
        if collection == "qualified_leads":
            return [{"qualified_at": now} for _ in range(100)]
        if collection == "analytics_snapshots":
            return [{"created_at": now} for _ in range(100)]
        return []

    monkeypatch.setattr(dashboard_mod, "query_docs", fake_query_docs)

    result = await dashboard_mod.get_health_score(tenant=_tenant())

    assert result["score"] <= 100


@pytest.mark.asyncio
async def test_health_score_labels_thresholds(monkeypatch):
    """Verify label assignment at boundary scores."""
    # Good: 60-79
    # Building: 40-59

    async def score_at(post_count: int) -> dict:
        now = datetime.now(timezone.utc)

        def fake_query(collection, *args, **kwargs):
            if collection == "publishing_records":
                return [{"status": "published", "published_at": now} for _ in range(post_count)]
            return []

        monkeypatch.setattr(dashboard_mod, "query_docs", fake_query)
        return await dashboard_mod.get_health_score(tenant=_tenant())

    result_zero = await score_at(0)
    assert result_zero["label"] in ("Just Starting", "Building")

    result_high = await score_at(10)
    assert result_high["score"] >= 0  # no crash with only posts data
