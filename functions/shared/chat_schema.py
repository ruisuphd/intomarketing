"""Pydantic schemas for marketing chat structured LLM output."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ChatStructuredReply(BaseModel):
    """Contract for POST /api/chat and /api/chat/stream model output."""

    model_config = ConfigDict(extra="ignore")

    reply: str = ""
    settings_to_update: dict = Field(default_factory=dict)
    suggested_questions: list[str] = Field(default_factory=list)
