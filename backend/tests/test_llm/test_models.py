"""Picking Gemini models at runtime instead of hard-coding them."""

from unittest.mock import MagicMock

import pytest

from app.core.config import settings
from app.llm.models import ANSWER, SCENE, ModelResolver, version_key


def model(name, actions=("generateContent",)):
    m = MagicMock()
    m.name = f"models/{name}"
    m.supported_actions = list(actions)
    return m


def lister(names=None, error=None):
    calls = []

    async def listing():
        async def it():
            for n in names or []:
                yield n if not isinstance(n, str) else model(n)
        calls.append(1)
        if error:
            raise error
        return it()

    listing.calls = calls
    return listing


KEY_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.8-flash-preview",
    "gemini-2.0-flash",
    "gemini-3.8-flash-tts",
    "gemini-3.8-pro",
    model("text-embedding-005", actions=("embedContent",)),
    model("gemini-3.8-flash-image", actions=("generateContent",)),
]


@pytest.fixture(autouse=True)
def nothing_pinned(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_MODEL", "")
    monkeypatch.setattr(settings, "GEMINI_SCENE_MODEL", "")


@pytest.mark.asyncio
async def test_answers_prefer_lite_and_scenes_prefer_full_flash():
    r = ModelResolver(lister(KEY_MODELS))
    assert (await r.candidates(ANSWER))[0] == "gemini-3.5-flash-lite"
    assert (await r.candidates(SCENE))[0] == "gemini-3.8-flash"


@pytest.mark.asyncio
async def test_non_text_and_non_flash_models_are_skipped():
    names = await ModelResolver(lister(KEY_MODELS)).candidates(SCENE)
    assert not any(w in n for n in names for w in ("tts", "embedding", "image", "pro"))


@pytest.mark.asyncio
async def test_a_pinned_model_comes_first(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_MODEL", "my-model")
    assert (await ModelResolver(lister(KEY_MODELS)).candidates(ANSWER))[0] == "my-model"


@pytest.mark.asyncio
async def test_a_404_is_skipped_and_its_hint_learned(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-2.5-flash-lite")
    r = ModelResolver(lister([]))
    r.mark_missing(
        "gemini-2.5-flash-lite",
        ANSWER,
        RuntimeError("404 ... Please update your code to use models/gemini-3.5-flash-lite for the latest."),
    )
    assert (await r.candidates(ANSWER))[0] == "gemini-3.5-flash-lite"
    assert "gemini-2.5-flash-lite" not in await r.candidates(ANSWER)


@pytest.mark.asyncio
async def test_the_listing_is_cached():
    listing = lister(KEY_MODELS)
    r = ModelResolver(listing)
    await r.candidates(ANSWER)
    await r.candidates(SCENE)
    assert len(listing.calls) == 1


@pytest.mark.asyncio
async def test_a_failed_listing_is_not_retried_on_every_request(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_MODEL", "pinned")
    listing = lister(error=RuntimeError("403"))
    r = ModelResolver(listing)
    assert (await r.candidates(ANSWER))[0] == "pinned"
    assert (await r.candidates(ANSWER))[0] == "pinned"
    assert len(listing.calls) == 1


def test_newest_stable_first():
    names = ["gemini-2.0-flash", "gemini-3.8-flash-preview", "gemini-3.8-flash"]
    assert sorted(names, key=version_key) == ["gemini-3.8-flash", "gemini-3.8-flash-preview", "gemini-2.0-flash"]


@pytest.mark.asyncio
async def test_with_no_listing_and_nothing_pinned_the_latest_aliases_are_tried():
    r = ModelResolver(lister(error=RuntimeError("403")))
    assert await r.candidates(ANSWER) == ["gemini-flash-lite-latest", "gemini-flash-latest"]
    assert (await r.candidates(SCENE))[0] == "gemini-flash-latest"
