"""Test that 500 error responses include CORS headers so browser can read them."""

from __future__ import annotations

from unittest.mock import MagicMock

from api.app import _cors_headers_for_request, allowed_origins


def test_cors_headers_helper_includes_origin_when_allowed():
    """Allowed origin receives Access-Control-Allow-Origin."""
    origin = allowed_origins[0] if allowed_origins else "http://localhost:3000"
    request = MagicMock()
    request.headers = {"origin": origin}
    headers = _cors_headers_for_request(request)
    assert headers["Access-Control-Allow-Origin"] == origin
    assert headers["Access-Control-Allow-Credentials"] == "true"
    assert "Access-Control-Allow-Methods" in headers
    assert "Access-Control-Allow-Headers" in headers
    assert "X-Request-ID" in headers["Access-Control-Allow-Headers"]


def test_cors_headers_helper_returns_empty_for_disallowed_origin():
    """Disallowed origin gets no CORS headers."""
    request = MagicMock()
    request.headers = {"origin": "https://evil.example.com"}
    headers = _cors_headers_for_request(request)
    assert headers == {}


def test_cors_headers_helper_returns_empty_when_no_origin():
    """Request without Origin header gets no CORS headers."""
    request = MagicMock()
    request.headers = {}
    headers = _cors_headers_for_request(request)
    assert headers == {}
