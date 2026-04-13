"""Aggregated dashboard bootstrap — one round-trip for initial shell data."""

from __future__ import annotations

import asyncio

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Request

from api.middleware.auth import require_tenant
from api.routes.billing import get_subscription
from api.routes.oauth import oauth_status
from api.routes.pipeline import pipeline_status
from api.routes.settings import get_settings
from api.routes.usage import get_usage
from shared.competitor_intel import get_top_competitor_signal
from shared.datetime_utils import coerce_datetime
from shared.firestore_client import count_docs, query_docs
from shared.logger import get_logger
from shared.models import TenantProfile

logger = get_logger("api.dashboard")

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _clamp(val: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, val))


@router.get("/health-score")
async def get_health_score(
    tenant: TenantProfile = Depends(require_tenant),
):
    """Return a 0–100 marketing health score based on recent activity."""
    tid = tenant.tenant_id
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    # Posts published in last 7 days (weight 30%)
    published = query_docs(
        "publishing_records",
        filters=[("status", "==", "published")],
        tenant_id=tid,
        limit=100,
    )
    recent_posts = sum(
        1 for p in published
        if (coerce_datetime(p.get("published_at")) or datetime.min.replace(tzinfo=timezone.utc)) >= week_ago
    )
    posts_score = _clamp(recent_posts * 25, 0, 100)  # 4+ posts = full score

    # Draft approval rate (weight 25%): scheduled / (scheduled + pending)
    all_drafts = query_docs("drafts", tenant_id=tid, limit=200)
    scheduled_count = sum(1 for d in all_drafts if d.get("status") == "scheduled")
    total_drafts = len(all_drafts)
    approval_score = _clamp((scheduled_count / total_drafts * 100) if total_drafts else 0)

    # Lead velocity: qualified leads in last 30 days (weight 25%)
    month_ago = now - timedelta(days=30)
    leads = query_docs("qualified_leads", tenant_id=tid, limit=200)
    recent_leads = sum(
        1 for l in leads
        if (coerce_datetime(l.get("qualified_at")) or coerce_datetime(l.get("created_at")) or datetime.min.replace(tzinfo=timezone.utc)) >= month_ago
    )
    leads_score = _clamp(recent_leads * 10, 0, 100)  # 10+ leads = full score

    # Analytics trend (weight 20%): has live metrics or recent snapshots
    snapshots = query_docs("analytics_snapshots", tenant_id=tid, limit=5)
    analytics_score = _clamp(len(snapshots) * 20, 0, 100)

    composite = (
        posts_score * 0.30
        + approval_score * 0.25
        + leads_score * 0.25
        + analytics_score * 0.20
    )
    score = round(_clamp(composite))

    if score >= 80:
        label = "Excellent"
    elif score >= 60:
        label = "Good"
    elif score >= 40:
        label = "Building"
    else:
        label = "Just Starting"

    return {
        "score": score,
        "label": label,
        "breakdown": {
            "posts": round(posts_score),
            "approvals": round(approval_score),
            "leads": round(leads_score),
            "analytics": round(analytics_score),
        },
    }


@router.get("/bootstrap")
async def dashboard_bootstrap(
    request: Request,
    tenant: TenantProfile = Depends(require_tenant),
):
    """Settings, billing, usage, pipeline, and OAuth status in parallel."""
    settings_coro = get_settings(tenant=tenant)
    billing_coro = get_subscription(tenant=tenant)
    usage_coro = get_usage(request, tenant=tenant)
    pipeline_coro = pipeline_status(tenant=tenant)
    oauth_coro = oauth_status(tenant=tenant)

    settings, billing, usage, pipeline, oauth = await asyncio.gather(
        settings_coro,
        billing_coro,
        usage_coro,
        pipeline_coro,
        oauth_coro,
    )

    try:
        competitor_signal = get_top_competitor_signal(tenant.tenant_id)
    except Exception:
        competitor_signal = None

    return {
        "settings": settings,
        "billing": billing,
        "usage": usage,
        "pipeline_status": pipeline,
        "oauth_status": oauth,
        "competitor_signal": competitor_signal,
    }
