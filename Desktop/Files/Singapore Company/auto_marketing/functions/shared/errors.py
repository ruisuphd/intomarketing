"""Stable API error envelope for JSON responses."""

from __future__ import annotations

from typing import Any

# Stable machine-facing codes (use in clients, alerts, runbooks)
INTERNAL = "INTERNAL"
RATE_LIMITED = "RATE_LIMITED"
VALIDATION_ERROR = "VALIDATION_ERROR"
BAD_REQUEST = "BAD_REQUEST"
UNAUTHORIZED = "UNAUTHORIZED"
FORBIDDEN = "FORBIDDEN"
NOT_FOUND = "NOT_FOUND"
CONFLICT = "CONFLICT"
PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE"
NOT_IMPLEMENTED = "NOT_IMPLEMENTED"
BAD_GATEWAY = "BAD_GATEWAY"
SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
HTTP_ERROR = "HTTP_ERROR"


def status_to_error_code(status: int) -> str:
    return {
        400: BAD_REQUEST,
        401: UNAUTHORIZED,
        403: FORBIDDEN,
        404: NOT_FOUND,
        409: CONFLICT,
        413: PAYLOAD_TOO_LARGE,
        422: VALIDATION_ERROR,
        429: RATE_LIMITED,
        500: INTERNAL,
        501: NOT_IMPLEMENTED,
        502: BAD_GATEWAY,
        503: SERVICE_UNAVAILABLE,
    }.get(status, HTTP_ERROR)


def build_error_body(
    *,
    error_code: str,
    detail: Any,
    trace_id: str | None = None,
    fields: list[dict[str, Any]] | None = None,
    status_code: int = 500,
    extras: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build JSON body. Always includes `error` and `detail` for backward compatibility."""
    body: dict[str, Any] = {"error": error_code, "detail": detail}
    if trace_id:
        body["trace_id"] = trace_id
    if fields:
        body["fields"] = fields
    if extras:
        body.update(extras)
    return body


def validation_fields_from_errors(errors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "loc": list(e.get("loc", ())),
            "msg": e.get("msg", ""),
            "type": e.get("type", ""),
        }
        for e in errors
    ]
