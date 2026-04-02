"""Browser push subscription management."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator

from api.middleware.auth import require_tenant
from shared.firestore_client import add_doc, query_docs, get_db
from shared.models import TenantProfile

router = APIRouter(prefix="/api/push", tags=["push"])


class PushSubscribeRequest(BaseModel):
    endpoint: str
    keys: dict[str, str]

    @field_validator("endpoint")
    @classmethod
    def validate_endpoint(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("Endpoint must use HTTPS")
        if len(v) > 2048:
            raise ValueError("Endpoint URL too long")
        return v

    @field_validator("keys")
    @classmethod
    def validate_keys(cls, v: dict[str, str]) -> dict[str, str]:
        if "p256dh" not in v or "auth" not in v:
            raise ValueError("keys must contain p256dh and auth")
        return v


def _endpoint_doc_id(endpoint: str) -> str:
    """Stable document ID derived from endpoint URL — avoids duplicates."""
    return hashlib.sha256(endpoint.encode()).hexdigest()[:32]


@router.post("/subscribe")
async def subscribe_push(
    body: PushSubscribeRequest,
    tenant: TenantProfile = Depends(require_tenant),
):
    """Store a Web Push subscription for the current tenant."""
    doc_id = _endpoint_doc_id(body.endpoint)
    db = get_db()
    doc_path = f"tenants/{tenant.tenant_id}/push_subscriptions/{doc_id}"
    db.document(doc_path).set(
        {
            "endpoint": body.endpoint,
            "keys": body.keys,
            "created_at": datetime.now(timezone.utc),
        }
    )
    return {"ok": True}


@router.delete("/subscribe")
async def unsubscribe_push(
    body: PushSubscribeRequest,
    tenant: TenantProfile = Depends(require_tenant),
):
    """Remove a Web Push subscription."""
    doc_id = _endpoint_doc_id(body.endpoint)
    db = get_db()
    doc_path = f"tenants/{tenant.tenant_id}/push_subscriptions/{doc_id}"
    db.document(doc_path).delete()
    return {"ok": True}
