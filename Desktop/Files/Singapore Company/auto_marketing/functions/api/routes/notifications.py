"""Notification center API — aggregates events from existing collections."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from api.middleware.auth import require_tenant
from shared.firestore_client import get_doc, query_docs
from shared.models import TenantProfile

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _to_iso(dt) -> str | None:
    if dt is None:
        return None
    if hasattr(dt, "isoformat"):
        return dt.isoformat()
    return str(dt)


@router.get("")
async def list_notifications(
    tenant: TenantProfile = Depends(require_tenant),
):
    """Return last 20 notification events from drafts, leads, pipeline, and billing."""
    events: list[dict] = []

    drafts = query_docs(
        "drafts",
        limit=20,
        order_by="-created_at",
        tenant_id=tenant.tenant_id,
    )
    platforms: set[str] = set()
    for d in drafts:
        for p in d.get("platforms_generated") or [d.get("platform")] or []:
            if p:
                platforms.add(p)

    if drafts:
        platform_str = (
            ", ".join(sorted(platforms)[:3]) if platforms else "LinkedIn, X, Instagram"
        )
        draft_suffix = "" if len(drafts) == 1 else "s"
        events.append(
            {
                "event": "drafts_generated",
                "at": _to_iso(datetime.now(timezone.utc)),
                "detail": f"{len(drafts)} draft{draft_suffix} generated for {platform_str}",
            }
        )

    leads = query_docs(
        "qualified_leads",
        limit=20,
        order_by="-created_at",
        tenant_id=tenant.tenant_id,
    )
    if leads:
        lead_suffix = "" if len(leads) == 1 else "s"
        events.append(
            {
                "event": "leads_qualified",
                "at": _to_iso(datetime.now(timezone.utc)),
                "detail": f"{len(leads)} new lead{lead_suffix} qualified",
            }
        )

    pipeline_doc = get_doc("pipeline_runs", "latest", tenant_id=tenant.tenant_id)
    if pipeline_doc and pipeline_doc.get("completed_at"):
        sig = pipeline_doc.get("signals_found", 0)
        drf = pipeline_doc.get("drafts_generated", 0)
        sig_suffix = "" if sig == 1 else "s"
        drf_suffix = "" if drf == 1 else "s"
        events.append(
            {
                "event": "pipeline_completed",
                "at": _to_iso(pipeline_doc.get("completed_at")),
                "detail": f"Pipeline completed — {sig} signal{sig_suffix}, {drf} draft{drf_suffix}",
            }
        )

    if (
        getattr(tenant, "subscription_status", "") == "active"
        and getattr(tenant, "subscription_tier", "") == "pro"
    ):
        events.append(
            {
                "event": "billing",
                "at": _to_iso(datetime.now(timezone.utc)),
                "detail": "Pro plan activated",
            }
        )

    events.sort(key=lambda e: e.get("at", "") or "", reverse=True)
    return {"notifications": events[:20]}
