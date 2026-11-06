"""In-process chat session memory.

This is a cache, not storage. The free Render tier spins the instance down when
idle, so anything here can vanish between two turns of the same conversation —
which is why the LeetCode language flow round-trips its state through the client
instead of relying on this, and why a signed-in user's history is rebuilt from
the database when it is missing.
"""

import time
from collections import OrderedDict, deque
from typing import Any, Dict, List, Optional

# Five exchanges. Five messages (two and a half exchanges) lost the thread of
# a conversation after a single follow-up.
DEFAULT_HISTORY_LENGTH = 10
# What the model is sent is also capped by length: one long solution must not
# crowd out the rest of the conversation.
MAX_CONTEXT_CHARS = 16000
MAX_MESSAGE_CHARS = 6000

# Bounded so a long-running instance cannot accumulate one entry per session
# seen, forever.
MAX_SESSIONS = 500
SESSION_TTL_SECONDS = 2 * 60 * 60


class ChatSession:
    """History and scratch state for a single conversation."""

    def __init__(self, session_id: str, max_history_length: int = DEFAULT_HISTORY_LENGTH):
        self.session_id = session_id
        self.history: deque = deque(maxlen=max_history_length)
        self.state: Dict[str, Any] = {}
        self.last_seen = time.monotonic()

    def add_message(self, role: str, content: str) -> None:
        """Append a message to the history."""
        self.history.append({"role": role, "content": content})
        self.last_seen = time.monotonic()

    def get_history(self) -> List[Dict[str, str]]:
        """Return the retained history, oldest first, within the length budget.

        Long messages are cut to their beginning, which holds the idea and
        the approach. The newest messages are kept first when the budget runs
        out.
        """
        kept: List[Dict[str, str]] = []
        total = 0
        for message in reversed(self.history):
            content = message["content"]
            if len(content) > MAX_MESSAGE_CHARS:
                content = content[:MAX_MESSAGE_CHARS] + "\n[...trimmed...]"
            if kept and total + len(content) > MAX_CONTEXT_CHARS:
                break
            total += len(content)
            kept.append({"role": message["role"], "content": content})
        kept.reverse()
        return kept

    def rewind_last_turn(self) -> None:
        """Drop the last answer and the question it replied to (for regenerate)."""
        while self.history and self.history[-1]["role"] != "user":
            self.history.pop()
        if self.history:
            self.history.pop()

    def set_state(self, key: str, value: Any) -> None:
        """Set a scratch value for this session."""
        self.state[key] = value
        self.last_seen = time.monotonic()

    def get_state(self, key: str, default: Any = None) -> Any:
        """Read a scratch value."""
        return self.state.get(key, default)


class ChatMemory:
    """A bounded, TTL'd collection of chat sessions."""

    def __init__(self, max_sessions: int = MAX_SESSIONS, ttl_seconds: int = SESSION_TTL_SECONDS):
        self.sessions: "OrderedDict[str, ChatSession]" = OrderedDict()
        self._max_sessions = max_sessions
        self._ttl_seconds = ttl_seconds

    def _evict(self) -> None:
        now = time.monotonic()
        stale = [
            key
            for key, session in self.sessions.items()
            if now - session.last_seen > self._ttl_seconds
        ]
        for key in stale:
            self.sessions.pop(key, None)

        while len(self.sessions) > self._max_sessions:
            self.sessions.popitem(last=False)

    def get_session(
        self, session_id: str, max_history_length: int = DEFAULT_HISTORY_LENGTH
    ) -> ChatSession:
        """Retrieve a session, creating it if this instance hasn't seen it."""
        session: Optional[ChatSession] = self.sessions.get(session_id)
        if session is None:
            session = ChatSession(session_id, max_history_length=max_history_length)
            self.sessions[session_id] = session
        else:
            session.last_seen = time.monotonic()
        self.sessions.move_to_end(session_id)
        self._evict()
        return session
