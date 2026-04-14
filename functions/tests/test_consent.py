"""Consent endpoint: IP hashing and record storage format."""

from __future__ import annotations

import hashlib
from unittest.mock import MagicMock

import pytest

from api.routes import consent as consent_mod
from api.routes.consent import ConsentRecord


def _make_request(ip: str = "1.2.3.4", forwarded: str | None = None) -> MagicMock:
    req = MagicMock()
    req.client = MagicMock()
    req.client.host = ip
    headers = {}
    if forwarded:
        headers["x-forwarded-for"] = forwarded
    req.headers = headers
    return req


@pytest.mark.asyncio
async def test_consent_hashes_ip(monkeypatch):
    """IP address must be SHA-256 hashed before storage."""
    written: dict = {}

    mock_doc = MagicMock()
    mock_doc.set = MagicMock(side_effect=lambda data, **kw: written.update({"data": data}))
    mock_collection = MagicMock()
    mock_collection.document.return_value = mock_doc
    mock_db = MagicMock()
    mock_db.collection.return_value = mock_collection
    monkeypatch.setattr(consent_mod, "get_db", lambda: mock_db)

    body = ConsentRecord(version="2026-04-01", analytics=True, marketing=False)
    req = _make_request("203.0.113.42")

    await consent_mod.record_consent(payload=body, request=req)

    stored = written["data"]
    # IP must not appear in plain text
    assert "203.0.113.42" not in str(stored)
    # Must have hashed IP (SHA-256 hex = 64 chars)
    assert "ip_hash" in stored
    assert len(stored["ip_hash"]) == 64


@pytest.mark.asyncio
async def test_consent_stores_correct_choices(monkeypatch):
    """Consent choices and version must be stored accurately."""
    written: dict = {}

    mock_doc = MagicMock()
    mock_doc.set = MagicMock(side_effect=lambda data, **kw: written.update({"data": data}))
    mock_collection = MagicMock()
    mock_collection.document.return_value = mock_doc
    mock_db = MagicMock()
    mock_db.collection.return_value = mock_collection
    monkeypatch.setattr(consent_mod, "get_db", lambda: mock_db)

    body = ConsentRecord(version="2026-04-01", analytics=False, marketing=True)
    req = _make_request("192.168.1.1")

    await consent_mod.record_consent(payload=body, request=req)

    stored = written["data"]
    assert stored["version"] == "2026-04-01"
    assert stored["analytics"] is False
    assert stored["marketing"] is True


@pytest.mark.asyncio
async def test_consent_uses_x_forwarded_for_ip(monkeypatch):
    """X-Forwarded-For real client IP should be hashed, not the proxy IP."""
    written: dict = {}

    mock_doc = MagicMock()
    mock_doc.set = MagicMock(side_effect=lambda data, **kw: written.update({"data": data}))
    mock_collection = MagicMock()
    mock_collection.document.return_value = mock_doc
    mock_db = MagicMock()
    mock_db.collection.return_value = mock_collection
    monkeypatch.setattr(consent_mod, "get_db", lambda: mock_db)

    body = ConsentRecord(version="2026-04-01", analytics=True, marketing=False)
    req = _make_request(ip="10.0.0.1", forwarded="198.51.100.5, 10.0.0.1")

    await consent_mod.record_consent(payload=body, request=req)

    expected_hash = hashlib.sha256("198.51.100.5".encode()).hexdigest()
    assert written["data"]["ip_hash"] == expected_hash


@pytest.mark.asyncio
async def test_consent_returns_ok_even_on_db_failure(monkeypatch):
    """Non-critical path: must return ok=True even if Firestore write fails."""
    mock_db = MagicMock()
    mock_db.collection.side_effect = Exception("Firestore down")
    monkeypatch.setattr(consent_mod, "get_db", lambda: mock_db)

    body = ConsentRecord(version="2026-04-01", analytics=True, marketing=False)
    req = _make_request("1.2.3.4")

    result = await consent_mod.record_consent(payload=body, request=req)

    assert result == {"ok": True}
