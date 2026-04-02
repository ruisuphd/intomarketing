"""Unit tests for shared error envelope helpers."""

from __future__ import annotations

from shared.errors import (
    INTERNAL,
    RATE_LIMITED,
    build_error_body,
    status_to_error_code,
    validation_fields_from_errors,
)


def test_status_to_error_code():
    assert status_to_error_code(404) == "NOT_FOUND"
    assert status_to_error_code(429) == "RATE_LIMITED"
    assert status_to_error_code(422) == "VALIDATION_ERROR"
    assert status_to_error_code(418) == "HTTP_ERROR"


def test_build_error_body():
    b = build_error_body(
        error_code=INTERNAL,
        detail="oops",
        trace_id="abc123",
        status_code=500,
    )
    assert b == {"error": "INTERNAL", "detail": "oops", "trace_id": "abc123"}


def test_build_error_body_with_extras():
    b = build_error_body(
        error_code=RATE_LIMITED,
        detail="slow down",
        trace_id="t1",
        status_code=429,
        extras={"limit": 10},
    )
    assert b["error"] == "RATE_LIMITED"
    assert b["limit"] == 10


def test_validation_fields_from_errors():
    fields = validation_fields_from_errors(
        [{"loc": ("body", "x"), "msg": "required", "type": "missing"}]
    )
    assert fields == [{"loc": ["body", "x"], "msg": "required", "type": "missing"}]
