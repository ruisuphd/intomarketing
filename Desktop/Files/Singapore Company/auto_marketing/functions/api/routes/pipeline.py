"""Pipeline status API."""

from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, BackgroundTasks, Depends

from api.middleware.auth import require_tenant
from api.middleware.legal import require_legal_acceptance
from shared.firestore_client import get_doc
from shared.logger import get_logger
from shared.models import TenantProfile
from shared.usage_limits import get_limits_for_tier

logger = get_logger("api.pipeline")

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])


def _next_run_at(tenant: TenantProfile) -> tuple[str, str]:
    """Compute next scheduled pipeline slot in the tenant's timezone.

    Cloud Scheduler invokes the multi-tenant function daily at 07:00 in
    `scheduler_timezone` (default Asia/Singapore); see `infra/modules/scheduler`.
    Per-tenant `notification_time` is used here for dashboard copy only until jobs are
    per-tenant.
    """
    tier = getattr(tenant, "subscription_tier", "starter") or "starter"
    limits = get_limits_for_tier(tier)
    pipeline_days = limits.get("pipeline_days_per_week", [0, 2, 4])
    tz_name = getattr(tenant, "timezone", "Asia/Singapore") or "Asia/Singapore"
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo("Asia/Singapore")

    notification_time = getattr(tenant, "notification_time", "07:00") or "07:00"
    hour, minute = 7, 0
    if ":" in notification_time:
        parts = notification_time.split(":")
        hour = int(parts[0]) if parts[0].isdigit() else 7
        minute = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0

    now = datetime.now(tz)
    today_weekday = now.weekday()
    candidate = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if candidate <= now or today_weekday not in pipeline_days:
        candidate += timedelta(days=1)
        while candidate.weekday() not in pipeline_days:
            candidate += timedelta(days=1)

    iso = candidate.isoformat()
    h = candidate.hour % 12 or 12
    ampm = "AM" if candidate.hour < 12 else "PM"
    local_str = f"{h}:{candidate.minute:02d} {ampm} {tz_name.replace('_', ' ')}"
    return iso, local_str


@router.get("/status")
async def pipeline_status(
    tenant: TenantProfile = Depends(require_tenant),
):
    """Return the latest pipeline run for this tenant."""
    doc = get_doc("pipeline_runs", "latest", tenant_id=tenant.tenant_id)
    tier = getattr(tenant, "subscription_tier", "starter") or "starter"
    limits = get_limits_for_tier(tier)
    pipeline_days = limits.get("pipeline_days_per_week", [0, 2, 4])
    next_run_at_iso, next_run_local = _next_run_at(tenant)

    if not doc:
        return {
            "last_run": None,
            "next_run": next_run_local,
            "next_run_local": next_run_local,
            "next_run_at": next_run_at_iso,
            "pipeline_days_per_week": pipeline_days,
            "has_run_before": False,
        }

    completed_at = doc.get("completed_at")
    if completed_at and hasattr(completed_at, "isoformat"):
        completed_at = completed_at.isoformat()

    last_run: dict = {
        "completed_at": completed_at,
        "status": doc.get("status", "unknown"),
        "drafts_generated": doc.get("drafts_generated", 0),
        "signals_found": doc.get("signals_found", 0),
        "leads_qualified": doc.get("leads_qualified", 0),
        "date": doc.get("date"),
    }
    if doc.get("skip_reason") is not None:
        last_run["skip_reason"] = doc.get("skip_reason")

    return {
        "last_run": last_run,
        "next_run": next_run_local,
        "next_run_local": next_run_local,
        "next_run_at": next_run_at_iso,
        "pipeline_days_per_week": pipeline_days,
        "has_run_before": True,
    }


async def _run_pipeline_background(tenant_id: str) -> None:
    """Run pipeline in background (async for BackgroundTasks)."""
    from shared.pipeline_runs import run_tenant_pipeline_with_record

    try:
        await run_tenant_pipeline_with_record(
            tenant_id,
            ignore_pipeline_schedule=True,
            force_send=False,
        )
    except Exception as exc:
        logger.error(
            "pipeline.trigger_failed", extra={"tenant_id": tenant_id, "error": str(exc)}
        )


@router.post("/trigger")
async def pipeline_trigger(
    bg: BackgroundTasks,
    tenant: TenantProfile = Depends(require_legal_acceptance),
):
    """Manually trigger the pipeline for the current tenant.

    Runs in the background; poll GET /api/pipeline/status. Manual runs ignore the
    tier pipeline-day calendar so \"Run now\" always executes work; digest email
    still respects the usual duplicate ledger unless force-send is used server-side.
    """
    bg.add_task(_run_pipeline_background, tenant.tenant_id)
    return {
        "ok": True,
        "accepted": True,
        "manual_run_bypasses_schedule": True,
        "message": "Pipeline started in the background. Poll GET /api/pipeline/status for results.",
    }
