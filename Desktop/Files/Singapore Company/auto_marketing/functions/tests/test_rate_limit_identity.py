from __future__ import annotations

from unittest.mock import MagicMock

from api.middleware import auth as auth_mw


def test_rate_limit_identity_uses_client_ip_when_no_bearer():
    req = MagicMock()

    def hget(k, d=None):
        kl = k.lower()
        if kl == "x-forwarded-for":
            return "203.0.113.5, 10.0.0.1"
        return d

    req.headers.get = hget
    req.client = MagicMock()
    req.client.host = "127.0.0.1"

    key = auth_mw.rate_limit_identity_key(req)
    assert key == "ip:203.0.113.5"


def test_rate_limit_identity_falls_back_to_socket_ip():
    req = MagicMock()
    req.headers.get = lambda k, d=None: d
    req.client = MagicMock()
    req.client.host = "198.51.100.2"

    key = auth_mw.rate_limit_identity_key(req)
    assert key == "ip:198.51.100.2"


def test_rate_limit_identity_uses_uid_when_token_valid(monkeypatch):
    req = MagicMock()
    req.headers.get = lambda k, d=None: (
        "Bearer faketoken" if k.lower() == "authorization" else d
    )

    monkeypatch.setattr(
        auth_mw,
        "_verify_firebase_token",
        lambda t: {"uid": "firebase-uid-abc"},
    )

    key = auth_mw.rate_limit_identity_key(req)
    assert key == "uid:firebase-uid-abc"


def test_rate_limit_identity_falls_back_to_ip_on_bad_token(monkeypatch):
    req = MagicMock()
    req.headers.get = lambda k, d=None: (
        "Bearer bad" if k.lower() == "authorization" else d
    )
    req.client = MagicMock()
    req.client.host = "10.1.1.1"

    def boom(_t):
        raise ValueError("invalid")

    monkeypatch.setattr(auth_mw, "_verify_firebase_token", boom)

    key = auth_mw.rate_limit_identity_key(req)
    assert key == "ip:10.1.1.1"
