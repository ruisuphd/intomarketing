"""Account data export and deletion API (GDPR)."""

from __future__ import annotations

import io
import json
import zipfile
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from api.middleware.auth import require_tenant_verified
from shared.firestore_client import get_db, get_tenant, query_docs
from shared.logger import get_logger
from shared.models import TenantProfile

logger = get_logger("api.account")

router = APIRouter(prefix="/api/account", tags=["account"])

_SUBCOLLECTIONS = [
    "drafts",
    "newsletters",
    "newsletter_campaigns",
    "calendar_events",
    "publishing_records",
    "qualified_leads",
    "prospect_signals",
    "outreach_drafts",
    "intelligence_items",
    "brand_chunks",
    "brand_documents",
    "documents",
    "suppress_list",
    "analytics_snapshots",
]


def _serialize(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    if hasattr(obj, "to_python"):  # google.cloud.firestore_v1.Timestamp
        return _serialize(obj.to_python())
    return obj


@router.get("/export")
async def export_account_data(
    tenant: TenantProfile = Depends(require_tenant_verified),
):
    """Export all tenant data as a JSON ZIP for GDPR compliance."""
    tenant_id = tenant.tenant_id
    tenant_doc = get_tenant(tenant_id)
    if not tenant_doc:
        raise HTTPException(status_code=404, detail="Tenant not found")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        tenant_export = {k: _serialize(v) for k, v in tenant_doc.items()}
        zf.writestr("tenant.json", json.dumps(tenant_export, indent=2))

        for coll in _SUBCOLLECTIONS:
            try:
                docs = query_docs(
                    coll,
                    tenant_id=tenant_id,
                    limit=10000,
                )
                if docs:
                    out = []
                    for d in docs:
                        rec = {k: _serialize(v) for k, v in d.items()}
                        out.append(rec)
                    zf.writestr(f"{coll}.json", json.dumps(out, indent=2))
            except Exception as exc:
                logger.warning(
                    "account.export.collection_failed",
                    extra={"collection": coll, "error": str(exc)},
                )

        # Export lead_activities nested under each qualified_lead.
        try:
            leads = query_docs("qualified_leads", tenant_id=tenant_id, limit=10000)
            all_activities = []
            for lead in leads:
                lead_id = lead.get("id")
                if not lead_id:
                    continue
                acts = query_docs(
                    f"qualified_leads/{lead_id}/lead_activities",
                    tenant_id=tenant_id,
                    limit=1000,
                )
                for act in acts:
                    rec = {k: _serialize(v) for k, v in act.items()}
                    rec["_lead_id"] = lead_id
                    all_activities.append(rec)
            if all_activities:
                zf.writestr("lead_activities.json", json.dumps(all_activities, indent=2))
        except Exception as exc:
            logger.warning(
                "account.export.collection_failed",
                extra={"collection": "lead_activities", "error": str(exc)},
            )

    buf.seek(0)
    filename = f"intomarketing-export-{tenant_id}-{datetime.now(timezone.utc).strftime('%Y%m%d')}.zip"
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _delete_collection(tenant_id: str, collection: str, batch_size: int = 100) -> int:
    """Delete all documents in a tenant subcollection. Returns count deleted."""
    db = get_db()
    path = f"tenants/{tenant_id}/{collection}"
    ref = db.collection(path)
    total = 0
    while True:
        docs = ref.limit(batch_size).stream()
        batch = db.batch()
        count = 0
        for snap in docs:
            batch.delete(snap.reference)
            count += 1
        if count == 0:
            break
        batch.commit()
        total += count
    return total


@router.delete("")
async def delete_account(
    confirm: str | None = None,
    tenant: TenantProfile = Depends(require_tenant_verified),
):
    """Permanently delete the account and all associated data.
    Requires confirm=DELETE in query params."""
    if confirm != "DELETE":
        raise HTTPException(
            status_code=400,
            detail="Account deletion requires confirm=DELETE. This action is irreversible.",
        )

    tenant_id = tenant.tenant_id
    tenant_ref = get_db().collection("tenants").document(tenant_id)
    if not tenant_ref.get().exists:
        raise HTTPException(status_code=404, detail="Tenant not found")

    deleted_counts = {}

    # Delete lead_activities nested under each qualified_lead before deleting leads.
    try:
        db = get_db()
        leads_path = f"tenants/{tenant_id}/qualified_leads"
        for lead_snap in db.collection(leads_path).stream():
            acts_path = f"{leads_path}/{lead_snap.id}/lead_activities"
            for act_snap in db.collection(acts_path).stream():
                act_snap.reference.delete()
    except Exception as exc:
        logger.warning(
            "account.delete.lead_activities_failed",
            extra={"tenant_id": tenant_id, "error": str(exc)},
        )

    for coll in _SUBCOLLECTIONS:
        try:
            n = _delete_collection(tenant_id, coll)
            if n > 0:
                deleted_counts[coll] = n
        except Exception as exc:
            logger.error(
                "account.delete.collection_failed",
                extra={"collection": coll, "error": str(exc)},
            )
            raise HTTPException(status_code=500, detail=f"Failed to delete {coll}")

    tenant_ref.delete()

    # GDPR/PDPA: write to suppress_list so the email cannot be used to
    # re-create a tenant and inadvertently restore data after an erasure request.
    try:
        owner_email = getattr(tenant, "owner_email", None)
        if owner_email:
            get_db().collection("suppress_list").add(
                {
                    "email": owner_email,
                    "reason": "deletion_request",
                    "added_at": datetime.now(timezone.utc).isoformat(),
                }
            )
    except Exception as exc:
        logger.warning(
            "account.suppress_list_failed",
            extra={"tenant_id": tenant_id, "error": str(exc)},
        )

    logger.info(
        "account.deleted", extra={"tenant_id": tenant_id, "deleted": deleted_counts}
    )

    return {"ok": True, "deleted": deleted_counts}
