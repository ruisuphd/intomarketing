"""Integration tests for JSON error envelope on API responses."""

from __future__ import annotations

from fastapi.testclient import TestClient

from api.app import app

client = TestClient(app)


def test_unauthorized_includes_error_code():
    r = client.get("/api/settings")
    assert r.status_code == 401
    data = r.json()
    assert data.get("error") == "UNAUTHORIZED"
    assert "detail" in data
    assert "trace_id" in data
