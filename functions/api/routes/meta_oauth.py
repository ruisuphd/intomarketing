"""Meta (Facebook / Instagram) OAuth — scaffold for Graph API app review.

Requires: META_APP_ID, META_APP_SECRET, Marketing API + pages_* / instagram_* scopes
after Meta Developer Console + Business Verification. Publishing uses Graph
`/{page-id}/feed` and Instagram Content Publishing API separately.
"""

from __future__ import annotations

import os
import urllib.parse

from fastapi import APIRouter, Depends, HTTPException

from api.middleware.auth import require_tenant
from shared.models import TenantProfile

router = APIRouter(prefix="/api/oauth/meta", tags=["oauth-meta"])

META_AUTH = "https://www.facebook.com/v21.0/dialog/oauth"
_DEFAULT_SCOPES = (
    "pages_show_list,pages_read_engagement,pages_manage_posts,"
    "instagram_basic,instagram_content_publish,business_management"
)


@router.get("/authorize")
async def meta_authorize(tenant: TenantProfile = Depends(require_tenant)):
    """Return Facebook OAuth URL when META_APP_ID is configured (else 501)."""
    app_id = os.getenv("META_APP_ID", "").strip()
    if not app_id:
        raise HTTPException(
            status_code=501,
            detail="Meta app is not configured. Set META_APP_ID and complete Meta app review.",
        )
    api_url = os.getenv("API_URL") or os.getenv("APP_URL", "http://localhost:8080")
    redirect_uri = f"{api_url.rstrip('/')}/api/oauth/meta/callback"
    params = {
        "client_id": app_id,
        "redirect_uri": redirect_uri,
        "scope": os.getenv("META_OAUTH_SCOPES", _DEFAULT_SCOPES),
        "response_type": "code",
        "state": tenant.tenant_id,
    }
    url = f"{META_AUTH}?{urllib.parse.urlencode(params)}"
    return {"redirect_url": url}


@router.get("/callback")
async def meta_callback():
    """Placeholder — exchange code for token and store in platform_credentials.meta."""
    raise HTTPException(
        status_code=501,
        detail="Meta callback not implemented yet. Wire token exchange and Graph publishing.",
    )
