"""Cookie consent record API — GDPR/PDPA audit trail."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel, field_validator

from shared.firestore_client import get_db
from shared.logger import get_logger

logger = get_logger("api.consent")

router = APIRouter(prefix="/api/consent", tags=["consent"])


class ConsentRecord(BaseModel):
    version: str
    analytics: bool
    marketing: bool

    @field_validator("version")
    @classmethod
    def version_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("version is required")
        return v.strip()


@router.post("")
async def record_consent(payload: ConsentRecord, request: Request):
    """
    Store a GDPR/PDPA consent record for audit purposes.

    This endpoint is public (unauthenticated) so it can be called before
    the user logs in. The requester IP is SHA-256 hashed before storage to
    satisfy data minimisation requirements.
    """
    # Hash the IP — store a fingerprint, not the raw address (data minimisation)
    forwarded = request.headers.get("x-forwarded-for")
    raw_ip = (forwarded.split(",")[0].strip() if forwarded else None) or (
        request.client.host if request.client else "unknown"
    )
    ip_hash = hashlib.sha256(raw_ip.encode()).hexdigest()

    doc_id = f"{ip_hash[:16]}_{payload.version}"

    try:
        get_db().collection("consent_records").document(doc_id).set(
            {
                "ip_hash": ip_hash,
                "version": payload.version,
                "analytics": payload.analytics,
                "marketing": payload.marketing,
                "recorded_at": datetime.now(timezone.utc).isoformat(),
            },
            merge=True,  # idempotent: re-consenting the same version overwrites
        )
    except Exception as exc:
        # Non-critical path: log and return success so the UI is not blocked
        logger.warning(
            "consent.record_failed",
            extra={"error": str(exc), "version": payload.version},
        )

    return {"ok": True}


@router.post("/csp-report")
async def csp_report(request: Request):
    """
    Receive Content-Security-Policy violation reports.
    Logs them for monitoring; returns 204 as required by the CSP spec.
    """
    try:
        body = await request.json()
        report = body.get("csp-report") or body
        logger.warning(
            "csp.violation",
            extra={
                "document_uri": report.get("document-uri"),
                "violated_directive": report.get("violated-directive"),
                "blocked_uri": report.get("blocked-uri"),
                "source_file": report.get("source-file"),
            },
        )
    except Exception:
        pass

    from fastapi.responses import Response

    return Response(status_code=204)
