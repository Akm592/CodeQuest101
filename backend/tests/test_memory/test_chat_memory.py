"""Chat session memory.

Note this is a cache, not storage — the free tier wipes it on spindown — so the
tests assert bounding and eviction as much as retrieval.
"""

from app.memory.chat_memory import ChatMemory, ChatSession


def test_a_new_session_starts_empty():
    session = ChatSession("s1")
    assert session.session_id == "s1"
    # history is a deque, so compare against the list accessor rather than []
    assert session.get_history() == []
    assert session.state == {}


def test_messages_are_appended_in_order():
    session = ChatSession("s2")
    session.add_message("user", "Hello")
    session.add_message("bot", "Hi there!")
    assert session.get_history() == [
        {"role": "user", "content": "Hello"},
        {"role": "bot", "content": "Hi there!"},
    ]


def test_history_is_capped_at_the_configured_length():
    session = ChatSession("s3", max_history_length=5)
    for i in range(1, 7):
        session.add_message("user" if i % 2 else "bot", str(i))

    history = session.get_history()
    assert len(history) == 5
    # The oldest message has been dropped.
    assert history[0]["content"] == "2"
    assert history[-1]["content"] == "6"


def test_state_round_trips():
    session = ChatSession("s4")
    assert session.get_state("missing") is None
    assert session.get_state("missing", "fallback") == "fallback"
    session.set_state("awaiting_language", True)
    assert session.get_state("awaiting_language") is True


def test_get_session_is_stable_for_the_same_id():
    memory = ChatMemory()
    first = memory.get_session("abc")
    first.add_message("user", "remember me")
    assert memory.get_session("abc") is first
    assert memory.get_session("abc").get_history()[0]["content"] == "remember me"


def test_sessions_are_bounded():
    """Previously an unbounded dict, growing one entry per session forever."""
    memory = ChatMemory(max_sessions=5)
    for i in range(20):
        memory.get_session(f"session-{i}")
    assert len(memory.sessions) <= 5


def test_stale_sessions_are_evicted():
    memory = ChatMemory(max_sessions=100, ttl_seconds=0)
    memory.get_session("old")
    memory.get_session("new")
    # With a zero TTL everything but the session just touched is collectable.
    assert len(memory.sessions) <= 1


def test_history_is_capped_by_length_newest_first():
    from app.memory.chat_memory import MAX_CONTEXT_CHARS, MAX_MESSAGE_CHARS

    session = ChatSession("budget", max_history_length=10)
    for i in range(10):
        session.add_message("bot", f"{i}" * (MAX_MESSAGE_CHARS + 500))
    history = session.get_history()
    assert history[-1]["content"].startswith("9")
    assert all(len(m["content"]) <= MAX_MESSAGE_CHARS + 20 for m in history)
    assert sum(len(m["content"]) for m in history) <= MAX_CONTEXT_CHARS + 40
    assert len(history) < 10
