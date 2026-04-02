from __future__ import annotations

import json

from shared.chat_schema import ChatStructuredReply
from shared.gemini_client import _extract_json


def test_chat_structured_reply_defaults():
    m = ChatStructuredReply()
    assert m.reply == ""
    assert m.settings_to_update == {}
    assert m.suggested_questions == []


def test_chat_structured_reply_roundtrip():
    data = {
        "reply": "Hi",
        "settings_to_update": {"tone": "friendly"},
        "suggested_questions": ["A?", "B?"],
    }
    m = ChatStructuredReply.model_validate(data)
    assert m.reply == "Hi"
    assert m.settings_to_update == {"tone": "friendly"}
    assert m.suggested_questions == ["A?", "B?"]


def test_extract_json_to_chat_schema():
    raw = json.dumps(
        {
            "reply": "ok",
            "settings_to_update": {},
            "suggested_questions": ["Q?"],
        }
    )
    parsed = _extract_json(raw)
    m = ChatStructuredReply.model_validate(parsed)
    assert m.reply == "ok"


def test_chat_structured_ignores_unknown_fields():
    m = ChatStructuredReply.model_validate(
        {
            "reply": "x",
            "settings_to_update": {},
            "suggested_questions": [],
            "unknown": 1,
        }
    )
    assert m.reply == "x"
    assert not hasattr(m, "unknown")
