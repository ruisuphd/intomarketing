from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from api.app import app

from api.middleware.legal import ensure_legal_acceptance
from api.routes.legal import LegalAcceptBody, accept_legal
from shared.legal_version import LEGAL_DOCS_VERSION
from shared.models import TenantProfile


def _tenant(**overrides) -> TenantProfile:
    base = {
        "tenant_id": "tenant-legal",
        "owner_uid": "uid-1",
        "owner_email": "owner@example.com",
        "company_name": "Co",
        "industry": "Other",
        "description": "d",
        "subscription_tier": "starter",
        "subscription_status": "active",
        "created_at": datetime(2026, 3, 13, tzinfo=timezone.utc),
    }
    base.update(overrides)
    return TenantProfile.model_validate(base)


def test_api_legal_version_is_public():
    client = TestClient(app)
    response = client.get("/api/legal/version")
    assert response.status_code == 200
    assert response.json()["version"] == LEGAL_DOCS_VERSION


def test_ensure_legal_raises_when_not_accepted():
    t = _tenant(legal_terms_version=None)
    with pytest.raises(HTTPException) as exc_info:
        ensure_legal_acceptance(t)
    assert exc_info.value.status_code == 403
    d = exc_info.value.detail
    assert isinstance(d, dict)
    assert d["error"] == "legal_acceptance_required"
    assert d["current_version"] == LEGAL_DOCS_VERSION
    assert d["accepted_version"] is None


def test_ensure_legal_raises_when_stale_version():
    t = _tenant(legal_terms_version="2020-01-01")
    with pytest.raises(HTTPException) as exc_info:
        ensure_legal_acceptance(t)
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["accepted_version"] == "2020-01-01"


def test_ensure_legal_passes_when_current():
    t = _tenant(legal_terms_version=LEGAL_DOCS_VERSION)
    ensure_legal_acceptance(t)


def test_accept_legal_persists_and_rejects_wrong_version(monkeypatch):
    writes: list[tuple[str, dict]] = []
    patterns: list[str] = []

    def fake_update(tenant_id: str, data: dict):
        writes.append((tenant_id, data))

    def fake_cache_delete(pat: str):
        patterns.append(pat)

    monkeypatch.setattr("api.routes.legal.update_tenant", fake_update)
    monkeypatch.setattr("api.routes.legal.cache_delete_pattern", fake_cache_delete)

    tenant = _tenant(owner_uid="u-99")
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(accept_legal(LegalAcceptBody(version="wrong"), tenant))
    assert exc_info.value.status_code == 400

    result = asyncio.run(
        accept_legal(LegalAcceptBody(version=LEGAL_DOCS_VERSION), tenant)
    )
    assert result["ok"] is True
    assert writes[0][0] == "tenant-legal"
    assert writes[0][1]["legal_terms_version"] == LEGAL_DOCS_VERSION
    assert writes[0][1]["legal_terms_accepted_at"] is not None
    assert patterns == ["tenant:uid:u-99*"]
