"""Regenerate replaces the last answer instead of adding a turn."""

from unittest.mock import AsyncMock, patch

import pytest

from app.memory.chat_memory import ChatSession
from tests.conftest import ALICE_SESSION


def test_rewind_drops_the_last_answer_and_its_question():
    session = ChatSession("r")
    session.add_message("user", "q1")
    session.add_message("bot", "a1")
    session.add_message("user", "q2")
    session.add_message("bot", "a2")
    session.rewind_last_turn()
    assert [m["content"] for m in session.get_history()] == ["q1", "a1"]


def test_rewind_on_an_empty_history_is_harmless():
    session = ChatSession("r")
    session.rewind_last_turn()
    assert session.get_history() == []


@pytest.fixture
def model():
    """Fake the model, recording the history each call is sent."""
    calls = []

    async def fake_stream(user_query, system_prompt, chat_history=None):
        calls.append([m["content"] for m in chat_history or []])
        yield f"answer {len(calls)}"

    with patch(
        "app.api.chat.gemini_integration.classify_intent_with_llm",
        AsyncMock(return_value="cs_tutor"),
    ), patch(
        "app.api.chat.scrape_leetcode_question", AsyncMock(return_value=None)
    ), patch("app.api.chat.gemini_integration.stream_chat_response", fake_stream):
        yield calls


def _ask(client, text, **extra):
    return client.post(
        "/chat", json={"user_input": text, **extra}, headers={"X-Session-ID": ALICE_SESSION}
    )


def test_a_regenerated_answer_does_not_see_the_one_it_replaces(client, model):
    _ask(client, "what is a heap")
    _ask(client, "what is a heap", regenerate=True)
    assert model == [[], []]


def test_a_follow_up_after_regenerating_sees_only_the_new_answer(client, model):
    _ask(client, "what is a heap")
    _ask(client, "what is a heap", regenerate=True)
    _ask(client, "why?")
    assert model[-1] == ["what is a heap", "answer 2"]


def test_signed_in_regenerate_replaces_the_stored_answer(client, model, as_user, alice):
    as_user(alice)
    db = AsyncMock()
    db.ensure_session_owned = AsyncMock(return_value=True)
    db.get_messages_by_session_id = AsyncMock(return_value=[])
    with patch("app.api.chat.SupabaseManager.for_user", AsyncMock(return_value=db)):
        _ask(client, "what is a heap", regenerate=True)

    db.delete_last_answer.assert_awaited_once_with(ALICE_SESSION)
    stored_senders = [c.kwargs["sender_type"] for c in db.store_message.await_args_list]
    assert stored_senders == ["bot"]
