"""Agency workspace API — multi-client overview (MVP)."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from api.middleware.auth import require_tenant
from shared.firestore_client import query_docs
from shared.logger import get_logger
from shared.models import TenantProfile

logger = get_logger("api.agency")

router = APIRouter(prefix="/api/agency", tags=["agency"])


@router.get("/overview")
async def agency_overview(tenant: TenantProfile = Depends(require_tenant)):
    """Return child tenants managed by this agency account (same owner_uid).

    Set ``agency_parent_tenant_id`` on client tenant docs to link them to a parent,
    or rely on shared ``owner_uid`` for a first-pass client list.
    """
    owner = getattr(tenant, "owner_uid", None) or ""
    if not owner:
        return {"clients": [], "parent_tenant_id": tenant.tenant_id}

    all_tenants = query_docs("tenants", tenant_id=None, limit=200)
    clients: list[dict] = []
    for row in all_tenants:
        if row.get("owner_uid") != owner:
            continue
        tid = row.get("tenant_id") or row.get("id")
        if not tid or tid == tenant.tenant_id:
            continue
        parent = row.get("agency_parent_tenant_id")
        if parent and parent != tenant.tenant_id:
            continue
        clients.append(
            {
                "tenant_id": tid,
                "company_name": row.get("company_name") or "",
                "subscription_tier": row.get("subscription_tier") or "starter",
            }
        )

    return {
        "clients": clients[:50],
        "parent_tenant_id": tenant.tenant_id,
    }
