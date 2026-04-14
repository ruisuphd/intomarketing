"""Dashboard bootstrap aggregates settings, billing, usage, pipeline, OAuth."""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

from api.routes import dashboard as dashboard_mod
from shared.models import TenantProfile


def _tenant() -> TenantProfile:
    return TenantProfile.model_validate(
        {
            "tenant_id": "tenant-boot",
            "owner_uid": "uid-boot",
            "owner_email": "owner@example.com",
            "company_name": "Co",
            "industry": "Other",
            "description": "d",
            "subscription_tier": "starter",
            "subscription_status": "active",
            "created_at": datetime(2026, 3, 13, tzinfo=timezone.utc),
        }
    )


@pytest.mark.asyncio
async def test_dashboard_bootstrap_returns_all_sections(monkeypatch):
    async def fake_settings(**kwargs):
        return {"tenant_id": "tenant-boot", "onboarding_completed": True, "company_name": "Co"}

    async def fake_billing(**kwargs):
        return {
            "tenant_id": "tenant-boot",
            "subscription_tier": "starter",
            "subscription_status": "active",
            "effective_tier": "starter",
            "access_source": "starter",
            "starter_access_expires_at": None,
            "starter_access_active": True,
            "has_paid_subscription": False,
            "can_manage_billing": True,
            "can_start_checkout": True,
            "stripe_customer_linked": False,
        }

    async def fake_usage(request, tenant):
        return {"tier": "starter", "usage": {}, "labels": {}}

    async def fake_pipeline(**kwargs):
        return {"last_run": None, "next_run": "soon", "has_run_before": False}

    async def fake_oauth(**kwargs):
        return {"linkedin": False, "x_twitter": False}

    async def fake_health(**kwargs):
        return {"score": 72, "label": "Good", "breakdown": {"posts": 80}}

    async def fake_goals(**kwargs):
        return {
            "goals": {"post_frequency": 12, "lead_volume": 6},
            "actuals": {"posts_this_month": 4, "leads_this_month": 2},
        }

    monkeypatch.setattr(dashboard_mod, "get_settings", fake_settings)
    monkeypatch.setattr(dashboard_mod, "get_subscription", fake_billing)
    monkeypatch.setattr(dashboard_mod, "get_usage", fake_usage)
    monkeypatch.setattr(dashboard_mod, "pipeline_status", fake_pipeline)
    monkeypatch.setattr(dashboard_mod, "oauth_status", fake_oauth)
    monkeypatch.setattr(dashboard_mod, "get_health_score", fake_health)
    monkeypatch.setattr(dashboard_mod, "get_goals", fake_goals)
    monkeypatch.setattr(
        dashboard_mod,
        "count_docs",
        lambda collection, *args, **kwargs: {
            "drafts": 7,
            "intelligence_items": 9,
            "qualified_leads": 3,
        }[collection],
    )

    request = MagicMock()
    request.state.tenant_tier = "starter"

    out = await dashboard_mod.dashboard_bootstrap(request, _tenant())

    assert out["settings"]["company_name"] == "Co"
    assert out["billing"]["effective_tier"] == "starter"
    assert out["usage"]["tier"] == "starter"
    assert out["pipeline_status"]["has_run_before"] is False
    assert out["oauth_status"]["linkedin"] is False
    assert out["health_score"]["score"] == 72
    assert out["goals"]["goals"]["post_frequency"] == 12
    assert out["overview_counts"] == {
        "drafts_ready": 7,
        "market_signals": 9,
        "warm_leads": 3,
    }
