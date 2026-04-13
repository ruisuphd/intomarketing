"""Public legal version and authenticated acceptance."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.middleware.auth import require_tenant
from shared.firestore_client import update_tenant
from shared.legal_version import LEGAL_DOCS_VERSION
from shared.models import TenantProfile
from shared.redis_client import cache_delete_pattern

router = APIRouter(prefix="/api/legal", tags=["legal"])


@router.get("/version")
async def get_legal_version():
    return {"version": LEGAL_DOCS_VERSION}


class LegalAcceptBody(BaseModel):
    version: str


@router.post("/accept")
async def accept_legal(
    body: LegalAcceptBody,
    tenant: TenantProfile = Depends(require_tenant),
):
    if body.version != LEGAL_DOCS_VERSION:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "legal_version_mismatch",
                "expected": LEGAL_DOCS_VERSION,
                "received": body.version,
            },
        )
    now = datetime.now(timezone.utc)
    update_tenant(
        tenant.tenant_id,
        {
            "legal_terms_version": LEGAL_DOCS_VERSION,
            "legal_terms_accepted_at": now,
        },
    )
    cache_delete_pattern(f"tenant:uid:{tenant.owner_uid}*")
    return {"ok": True, "version": LEGAL_DOCS_VERSION}
