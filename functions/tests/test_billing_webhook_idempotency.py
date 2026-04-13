from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from api.routes import billing


@pytest.mark.asyncio
async def test_stripe_webhook_skips_duplicate_event_id(monkeypatch):
    store: dict = {}

    monkeypatch.setattr(billing, "cache_get", lambda k: store.get(k))
    monkeypatch.setattr(
        billing,
        "cache_set",
        lambda k, v, ttl_seconds=0: store.__setitem__(k, v),
    )
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    monkeypatch.setattr(billing, "_ensure_stripe_api_key", lambda: None)

    calls: list = []
    monkeypatch.setattr(
        billing,
        "_handle_subscription_updated",
        lambda d: calls.append(d),
    )

    import stripe

    monkeypatch.setattr(
        stripe.Webhook,
        "construct_event",
        staticmethod(
            lambda payload, sig, secret: {
                "id": "evt_duplicate_1",
                "type": "customer.subscription.updated",
                "data": {"object": {"customer": "cus_x", "status": "active"}},
            }
        ),
    )

    req = AsyncMock()
    req.body = AsyncMock(return_value=b"{}")
    req.headers.get = lambda k, d=None: "sig" if k == "stripe-signature" else d

    await billing.stripe_webhook(req)
    await billing.stripe_webhook(req)
    assert len(calls) == 1
