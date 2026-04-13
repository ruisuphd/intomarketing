"""Sentry helpers for entrypoints that are not the FastAPI app (e.g. Cloud Functions)."""

from __future__ import annotations

import os

_initialized = False


def ensure_sentry_initialized() -> None:
    global _initialized
    if _initialized:
        return
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        return
    try:
        import sentry_sdk

        sentry_sdk.init(
            dsn=dsn,
            traces_sample_rate=0.0,
            environment=os.getenv("SENTRY_ENVIRONMENT", "production"),
        )
        _initialized = True
    except Exception:
        pass


def capture_exception_tagged(exc: BaseException, **tags: str) -> None:
    ensure_sentry_initialized()
    if not os.getenv("SENTRY_DSN"):
        return
    try:
        import sentry_sdk

        with sentry_sdk.push_scope() as scope:
            for k, v in tags.items():
                if v:
                    scope.set_tag(k, v)
            sentry_sdk.capture_exception(exc)
    except Exception:
        pass
