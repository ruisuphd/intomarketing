from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import pytest

import pipeline as pipeline_module
from shared import pipeline_runs as pr


def test_pipeline_run_status_from_result_skipped():
    assert (
        pr.pipeline_run_status_from_result({"email_status": "skipped_not_pipeline_day"})
        == "skipped"
    )


def test_pipeline_run_status_from_result_success():
    assert pr.pipeline_run_status_from_result({"email_status": "sent"}) == "success"


def test_record_pipeline_run_success(monkeypatch):
    captured: dict = {}

    def fake_set_doc(collection, doc_id, data, *, tenant_id=None):
        captured["collection"] = collection
        captured["doc_id"] = doc_id
        captured["data"] = data
        captured["tenant_id"] = tenant_id

    monkeypatch.setattr(pr, "set_doc", fake_set_doc)
    started = datetime(2026, 3, 20, 1, 0, tzinfo=timezone.utc)
    done = datetime(2026, 3, 20, 1, 5, tzinfo=timezone.utc)
    pr.record_pipeline_run(
        "t-1",
        started_at=started,
        completed_at=done,
        status="success",
        result={
            "post_generated": True,
            "intel_items": 3,
            "leads_found": 2,
            "date": "2026-03-20",
            "timezone": "Asia/Singapore",
        },
    )
    assert captured["tenant_id"] == "t-1"
    assert captured["data"]["status"] == "success"
    assert captured["data"]["drafts_generated"] == 1
    assert captured["data"]["signals_found"] == 3
    assert captured["data"]["leads_qualified"] == 2


def test_run_tenant_pipeline_with_record_records_failure(monkeypatch):
    async def boom(**kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(pipeline_module, "_run_pipeline", boom)
    recorded: list[dict] = []

    def capture_record(*args, **kwargs):
        recorded.append({"args": args, "kwargs": kwargs})

    monkeypatch.setattr(pr, "record_pipeline_run", capture_record)

    with pytest.raises(RuntimeError, match="boom"):
        asyncio.run(
            pr.run_tenant_pipeline_with_record("t-2", ignore_pipeline_schedule=True)
        )

    assert len(recorded) == 1
    assert recorded[0]["kwargs"]["status"] == "failed"
    assert "boom" in recorded[0]["kwargs"]["error"]


def test_run_tenant_pipeline_with_record_success(monkeypatch):
    async def ok(**kwargs):
        assert kwargs.get("ignore_pipeline_schedule") is True
        return {
            "email_status": "sent",
            "post_generated": False,
            "intel_items": 1,
            "leads_found": 0,
            "date": "2026-03-21",
            "timezone": "UTC",
        }

    monkeypatch.setattr(pipeline_module, "_run_pipeline", ok)
    monkeypatch.setattr(pr, "record_pipeline_run", lambda *a, **k: None)

    out = asyncio.run(
        pr.run_tenant_pipeline_with_record("t-3", ignore_pipeline_schedule=True)
    )
    assert out["email_status"] == "sent"
