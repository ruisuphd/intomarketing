"""Token refresh: X OAuth refresh path and LinkedIn expired path."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from shared.token_refresh import is_token_expired, refresh_x_token


class TestIsTokenExpired:
    def test_none_expires_at_is_not_expired(self):
        assert not is_token_expired(None)

    def test_far_future_is_not_expired(self):
        future = datetime.now(timezone.utc) + timedelta(days=7)
        assert not is_token_expired(future)

    def test_past_is_expired(self):
        past = datetime.now(timezone.utc) - timedelta(seconds=10)
        assert is_token_expired(past)

    def test_within_buffer_is_expired(self):
        soon = datetime.now(timezone.utc) + timedelta(seconds=60)
        assert is_token_expired(soon, buffer_seconds=120)

    def test_outside_buffer_is_not_expired(self):
        later = datetime.now(timezone.utc) + timedelta(seconds=200)
        assert not is_token_expired(later, buffer_seconds=120)


@pytest.mark.asyncio
async def test_refresh_x_token_success():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "access_token": "new_token",
        "refresh_token": "new_refresh",
        "expires_in": 7200,
    }

    with patch("shared.token_refresh.httpx") as mock_httpx:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_httpx.AsyncClient.return_value = mock_client

        result = await refresh_x_token("client_id", "client_secret", "old_refresh")

    assert result is not None
    assert result["access_token"] == "new_token"
    assert result["refresh_token"] == "new_refresh"
    assert "expires_at" in result


@pytest.mark.asyncio
async def test_refresh_x_token_failure_returns_none():
    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.json.return_value = {"error": "invalid_grant"}

    with patch("shared.token_refresh.httpx") as mock_httpx:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_httpx.AsyncClient.return_value = mock_client

        result = await refresh_x_token("client_id", "client_secret", "bad_refresh")

    assert result is None


@pytest.mark.asyncio
async def test_refresh_x_token_network_error_returns_none():
    with patch("shared.token_refresh.httpx") as mock_httpx:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.post = AsyncMock(side_effect=Exception("network error"))
        mock_httpx.AsyncClient.return_value = mock_client

        result = await refresh_x_token("client_id", "client_secret", "refresh")

    assert result is None
