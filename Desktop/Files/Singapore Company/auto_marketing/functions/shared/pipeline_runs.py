"""Persist latest pipeline run summary for dashboard / notifications."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from shared.firestore_client import set_doc


def pipeline_run_status_from_result(result: dict[str, Any]) -> str:
    """Map _run_pipeline result to a dashboard status string."""
    if result.get("email_status") == "skipped_not_pipeline_day":
        return "skipped"
    return "success"


def record_pipeline_run(
    tenant_id: str,
    *,
    started_at: datetime,
    completed_at: datetime,
    status: str,
    result: dict[str, Any] | None = None,
    error: str | None = None,
) -> None:
    """Write tenants/{tenant_id}/pipeline_runs/latest (full document replace)."""
    if not tenant_id:
        raise ValueError("tenant_id is required")

    payload: dict[str, Any] = {
        "started_at": started_at,
        "completed_at": completed_at,
        "status": status,
        "drafts_generated": 0,
        "signals_found": 0,
        "leads_qualified": 0,
    }

    if status == "success" and result is not None:
        payload["drafts_generated"] = 1 if result.get("post_generated") else 0
        payload["signals_found"] = int(result.get("intel_items") or 0)
        payload["leads_qualified"] = int(result.get("leads_found") or 0)
        if result.get("date") is not None:
            payload["date"] = result["date"]
        if result.get("timezone") is not None:
            payload["timezone"] = result["timezone"]
    elif status == "skipped" and result is not None:
        payload["drafts_generated"] = 0
        payload["signals_found"] = 0
        payload["leads_qualified"] = 0
        if result.get("date") is not None:
            payload["date"] = result["date"]
        if result.get("timezone") is not None:
            payload["timezone"] = result["timezone"]
        payload["skip_reason"] = result.get("email_status") or "skipped"
    elif status in ("failed", "timeout"):
        if error:
            payload["error"] = error[:500]

    set_doc("pipeline_runs", "latest", payload, tenant_id=tenant_id)


async def run_tenant_pipeline_with_record(
    tenant_id: str,
    *,
    ignore_pipeline_schedule: bool = False,
    force_send: bool = False,
    trace_id: str = "",
) -> dict[str, Any]:
    """Run `_run_pipeline` for a tenant and write `pipeline_runs/latest`. Re-raises on failure."""
    from pipeline import _run_pipeline

    started_at = datetime.now(timezone.utc)
    try:
        result = await _run_pipeline(
            tenant_id=tenant_id,
            force_send=force_send,
            trace_id=trace_id,
            ignore_pipeline_schedule=ignore_pipeline_schedule,
        )
        completed_at = datetime.now(timezone.utc)
        record_pipeline_run(
            tenant_id,
            started_at=started_at,
            completed_at=completed_at,
            status=pipeline_run_status_from_result(result),
            result=result,
        )
        return result
    except Exception as exc:
        completed_at = datetime.now(timezone.utc)
        record_pipeline_run(
            tenant_id,
            started_at=started_at,
            completed_at=completed_at,
            status="failed",
            error=str(exc),
        )
        raise
