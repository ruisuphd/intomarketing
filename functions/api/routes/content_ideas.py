"""Content ideas queue — tenant-scoped idea scratch pad."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore
from pydantic import BaseModel, field_validator

from api.middleware.legal import require_access_with_legal
from shared.firestore_client import get_tenant, update_tenant
from shared.models import TenantProfile

router = APIRouter(prefix="/api/content-ideas", tags=["content-ideas"])

_MAX_IDEAS = 20


class IdeaCreate(BaseModel):
    text: str

    @field_validator("text", mode="before")
    @classmethod
    def clean_text(cls, v: str) -> str:
        return v.strip()[:500] if isinstance(v, str) else v


@router.get("")
async def list_ideas(tenant: TenantProfile = Depends(require_access_with_legal("starter", "pro"))):
    """Return the tenant's content ideas queue."""
    doc = get_tenant(tenant.tenant_id) or {}
    ideas = doc.get("content_ideas") or []
    return {"ideas": ideas}


@router.post("")
async def add_idea(
    body: IdeaCreate,
    tenant: TenantProfile = Depends(require_access_with_legal("starter", "pro")),
):
    """Append an idea to the queue (capped at _MAX_IDEAS)."""
    if not body.text:
        raise HTTPException(status_code=422, detail="text cannot be empty")
    doc = get_tenant(tenant.tenant_id) or {}
    existing: list = doc.get("content_ideas") or []
    if len(existing) >= _MAX_IDEAS:
        raise HTTPException(
            status_code=400,
            detail=f"Ideas queue is full ({_MAX_IDEAS} max). Remove some before adding more.",
        )
    new_idea = {
        "id": uuid.uuid4().hex[:16],
        "text": body.text,
        "added_at": datetime.now(timezone.utc).isoformat(),
    }
    update_tenant(
        tenant.tenant_id,
        {"content_ideas": firestore.ArrayUnion([new_idea])},
    )
    return {"ok": True, "idea": new_idea}


@router.delete("/{idea_id}")
async def delete_idea(
    idea_id: str,
    tenant: TenantProfile = Depends(require_access_with_legal("starter", "pro")),
):
    """Remove a specific idea from the queue."""
    doc = get_tenant(tenant.tenant_id) or {}
    existing: list = doc.get("content_ideas") or []
    to_remove = next((item for item in existing if item.get("id") == idea_id), None)
    if not to_remove:
        raise HTTPException(status_code=404, detail="Idea not found")
    update_tenant(
        tenant.tenant_id,
        {"content_ideas": firestore.ArrayRemove([to_remove])},
    )
    return {"ok": True}
