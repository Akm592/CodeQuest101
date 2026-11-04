"""Which Gemini models to call, found at runtime instead of hard-coded.

Google retires model names with little notice: gemini-2.5-flash and then
gemini-2.5-flash-lite started returning 404 "no longer available to new
users", and each hard-coded default took production down until someone edited
the code. So the backend asks the API which models this key can use, picks one
per role, and when a model 404s it learns the replacement (the 404 message
usually names one) and moves on.

GEMINI_MODEL / GEMINI_SCENE_MODEL still pin a model when set; empty means
choose automatically.
"""

import re
import time
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

from app.core.config import settings
from app.core.logger import logger

ANSWER = "answer"  # every chat answer and the intent check: fast, so prefer lite
SCENE = "scene"    # traces, made only on click: can afford the stronger model
ROLES = (ANSWER, SCENE)

# Models that list generateContent but aren't general text models.
_SKIP_WORDS = (
    "tts", "image", "audio", "live", "embed", "vision", "learnlm", "gemma",
    "aqa", "robotics", "computer-use", "native",
)
# After a failed listing, wait this long before asking again, so a broken
# listing doesn't add a round trip to every request.
RELIST_AFTER_S = 60.0
# An overloaded model (429/5xx after retries) goes to the back of the queue for
# this long, so the next requests start on a model that is answering.
COOL_DOWN_S = 120.0

# Last resort when the listing fails: Google's aliases that always point at
# the current model of each tier, so they don't get retired like versions.
_ALIASES = {ANSWER: ["gemini-flash-lite-latest", "gemini-flash-latest"]}
_ALIASES[SCENE] = list(reversed(_ALIASES[ANSWER]))

_HINT = re.compile(r"use models/([\w.\-]+)")


def version_key(name: str) -> Tuple:
    """Sort newest first: higher version, then stable over preview/exp."""
    match = re.search(r"(\d+(?:\.\d+)?)", name)
    version = float(match.group(1)) if match else 0.0
    return (-version, "preview" in name or "exp" in name, name)


def _is_lite(name: str) -> bool:
    return "lite" in name


class ModelResolver:
    """Orders the models to try for each role, learning from 404s."""

    def __init__(self, list_models: Callable[[], Any]):
        # Called each time a listing is needed, so a patched client is used.
        self._list_models = list_models
        self._listed: Optional[List[str]] = None
        self._listed_failed_at: Optional[float] = None
        self._missing: Set[str] = set()
        self._learned: Dict[str, str] = {}
        self._cooling: Dict[str, float] = {}

    def reset(self) -> None:
        """Forget everything learned (for tests)."""
        self.__init__(self._list_models)

    def _override(self, role: str) -> str:
        return (settings.GEMINI_SCENE_MODEL if role == SCENE else settings.GEMINI_MODEL).strip()

    async def _available(self) -> List[str]:
        if self._listed is not None:
            return self._listed
        now = time.monotonic()
        if self._listed_failed_at is not None and now - self._listed_failed_at < RELIST_AFTER_S:
            return []
        try:
            names = []
            async for model in await self._list_models():
                name = (model.name or "").removeprefix("models/")
                if (
                    name.startswith("gemini")
                    and "generateContent" in (model.supported_actions or [])
                    and not any(word in name for word in _SKIP_WORDS)
                ):
                    names.append(name)
        except Exception as e:
            self._listed_failed_at = now
            logger.error(f"Could not list Gemini models: {e}")
            return []
        names = sorted(set(names), key=version_key)
        # Flash models are the fast, cheap tier; others (pro) only if no flash.
        flash = [n for n in names if "flash" in n]
        self._listed = flash or names
        logger.info(f"Gemini models available to this key: {self._listed[:8]}")
        return self._listed

    def _for_role(self, role: str, available: List[str]) -> List[str]:
        lite = [n for n in available if _is_lite(n)]
        full = [n for n in available if not _is_lite(n)]
        return lite + full if role == ANSWER else full + lite

    async def candidates(self, role: str) -> List[str]:
        """Return the models to try for ``role``, best first, skipping known 404s."""
        other = SCENE if role == ANSWER else ANSWER
        ordered = [
            self._override(role),
            self._learned.get(role, ""),
            *self._for_role(role, await self._available()),
            self._override(other),
            self._learned.get(other, ""),
            *_ALIASES[role],
        ]
        seen: Set[str] = set()
        result = []
        for name in ordered:
            if name and name not in seen and name not in self._missing:
                seen.add(name)
                result.append(name)
        now = time.monotonic()
        # Stable sort: overloaded models keep their order, after the rest.
        return sorted(result, key=lambda n: self._cooling.get(n, 0.0) > now)

    def cool_down(self, model: str) -> None:
        """Move an overloaded model to the back of the queue for a while."""
        self._cooling[model] = time.monotonic() + COOL_DOWN_S
        logger.warning(f"{model} is overloaded; trying other models first for {COOL_DOWN_S:.0f}s")

    def mark_missing(self, model: str, role: str, error: Exception) -> None:
        """Remember that ``model`` 404ed; adopt the replacement its message names."""
        self._missing.add(model)
        match = _HINT.search(str(error))
        hint = match.group(1).rstrip(".") if match else ""
        if hint and hint not in self._missing:
            self._learned[role] = hint
            logger.warning(f"{model} is gone for this key; switching {role} to {hint}")
        else:
            logger.warning(f"{model} is gone for this key; trying the next model")

    async def warm(self) -> None:
        """List models at startup so the first request doesn't wait for it."""
        chosen = {role: (await self.candidates(role))[:1] for role in ROLES}
        logger.info(f"Gemini models chosen: {chosen}")

    async def current(self) -> Dict[str, str]:
        """Return the model each role would use now."""
        return {role: next(iter(await self.candidates(role)), "") for role in ROLES}
