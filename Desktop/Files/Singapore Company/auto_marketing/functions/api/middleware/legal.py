"""Enforce acceptance of current Terms of Service (and incorporated Privacy Policy)."""

from __future__ import annotations

from fastapi import Depends, HTTPException, Request

from api.middleware.auth import require_access, require_subscription, require_tenant
from shared.legal_version import LEGAL_DOCS_VERSION
from shared.models import TenantProfile


def ensure_legal_acceptance(tenant: TenantProfile) -> None:
    accepted = tenant.legal_terms_version
    if accepted != LEGAL_DOCS_VERSION:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "legal_acceptance_required",
                "current_version": LEGAL_DOCS_VERSION,
                "accepted_version": accepted,
            },
        )


def require_legal_acceptance(
    tenant: TenantProfile = Depends(require_tenant),
) -> TenantProfile:
    ensure_legal_acceptance(tenant)
    return tenant


def require_access_with_legal(*tiers: str):
    access_dep = require_access(*tiers)

    def _dep(tenant: TenantProfile = Depends(access_dep)) -> TenantProfile:
        ensure_legal_acceptance(tenant)
        return tenant

    return _dep


def require_subscription_with_legal(*tiers: str):
    sub_dep = require_subscription(*tiers)

    def _dep(tenant: TenantProfile = Depends(sub_dep)) -> TenantProfile:
        ensure_legal_acceptance(tenant)
        return tenant

    return _dep


def require_legal_acceptance_verified(
    request: Request,
    tenant: TenantProfile = Depends(require_legal_acceptance),
) -> TenantProfile:
    if not getattr(request.state, "email_verified", False):
        raise HTTPException(
            status_code=403,
            detail="Verify your email address before using the AI assistant.",
        )
    return tenant


def require_access_with_legal_verified(*tiers: str):
    inner = require_access_with_legal(*tiers)

    def _dep(
        request: Request,
        tenant: TenantProfile = Depends(inner),
    ) -> TenantProfile:
        if not getattr(request.state, "email_verified", False):
            raise HTTPException(
                status_code=403,
                detail="Verify your email address before using AI generation features.",
            )
        return tenant

    return _dep


def require_subscription_with_legal_verified(*tiers: str):
    inner = require_subscription_with_legal(*tiers)

    def _dep(
        request: Request,
        tenant: TenantProfile = Depends(inner),
    ) -> TenantProfile:
        if not getattr(request.state, "email_verified", False):
            raise HTTPException(
                status_code=403,
                detail="Verify your email address before using AI generation features.",
            )
        return tenant

    return _dep
