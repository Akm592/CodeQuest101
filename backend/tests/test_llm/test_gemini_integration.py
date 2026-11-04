"""The Gemini wrapper, with the client mocked out."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.config import settings
from app.llm import gemini_integration
from app.llm.gemini_integration import GenerationError, generate_scene, stream_chat_response
from app.schemas.visualization_schemas import SceneResult, TraceRequest

ANSWER_MODEL = "answer-model"
SCENE_MODEL = "scene-model"
CONTEXT = "Question: two sum\n\nAnswer: use a hash map of complements."
TRACE = TraceRequest(problem="Two Sum", input="nums=[2,7], target=9", approach="hash map")

VALID_SCENE = {
    "title": "Two Sum",
    "summary": "Look up each complement before storing the value.",
    "structures": [{"id": "nums", "type": "array", "label": "nums"}],
    "code": {"language": "python", "lines": ["for i, x in enumerate(nums):", "    ..."]},
    "steps": [{
        "title": "Look at 2",
        "explanation": "9 - 2 = 7 has not been seen, so store 2.",
        "code_line": 1,
        "states": [{"structure": "nums", "items": ["2", "7"]}],
    }],
}


@pytest.fixture(autouse=True)
def no_retry_pause():
    """Retries back off with real sleeps; tests shouldn't wait for them."""
    with patch("app.llm.gemini_integration.asyncio.sleep", AsyncMock()) as sleep:
        yield sleep


@pytest.fixture(autouse=True)
def mock_genai_client(monkeypatch):
    # Pinned names keep these tests about fallbacks, not discovery; the
    # resolver's own tests cover picking models with nothing pinned.
    monkeypatch.setattr(settings, "GEMINI_MODEL", ANSWER_MODEL)
    monkeypatch.setattr(settings, "GEMINI_SCENE_MODEL", SCENE_MODEL)
    gemini_integration.resolver.reset()
    with patch("app.llm.gemini_integration.client") as mock_client:
        mock_client.aio.models.generate_content = AsyncMock()
        # By default the key lists no models, so discovery adds nothing.
        mock_client.aio.models.list = AsyncMock(return_value=pager([]))
        yield mock_client


def model(name, actions=("generateContent",)):
    m = MagicMock()
    m.name = f"models/{name}"
    m.supported_actions = list(actions)
    return m


def pager(models):
    async def it():
        for m in models:
            yield m
    return it()


def response(text="", parsed=None):
    r = MagicMock()
    r.text = text
    r.parsed = parsed
    return r


# --- Streaming answers -------------------------------------------------------


@pytest.mark.asyncio
async def test_the_system_prompt_is_a_system_instruction_not_a_user_turn(mock_genai_client):
    """It was sent as the first user message, which the model can argue with."""
    async def chunks():
        yield MagicMock(text="chunk1")
        yield MagicMock(text="chunk2")

    mock_genai_client.aio.models.generate_content_stream = AsyncMock(return_value=chunks())

    out = [c async for c in stream_chat_response("Tell me a story", "You are a storyteller.", [])]

    assert out == ["chunk1", "chunk2"]
    _, kwargs = mock_genai_client.aio.models.generate_content_stream.call_args
    assert [c.parts[0].text for c in kwargs["contents"]] == ["Tell me a story"]
    assert kwargs["config"].system_instruction == "You are a storyteller."


@pytest.mark.asyncio
async def test_history_precedes_the_query(mock_genai_client):
    async def chunks():
        yield MagicMock(text="ok")

    mock_genai_client.aio.models.generate_content_stream = AsyncMock(return_value=chunks())
    history = [
        {"role": "user", "content": "Once upon a time"},
        {"role": "model", "content": "there was a knight"},
    ]

    [c async for c in stream_chat_response("Continue", "sys", history)]

    contents = mock_genai_client.aio.models.generate_content_stream.call_args.kwargs["contents"]
    assert [c.role for c in contents] == ["user", "model", "user"]
    assert contents[-1].parts[0].text == "Continue"


@pytest.mark.asyncio
async def test_a_model_failure_raises_instead_of_becoming_the_answer(mock_genai_client):
    """It used to yield "Error generating response." which was saved as the reply."""
    mock_genai_client.aio.models.generate_content_stream = AsyncMock(side_effect=RuntimeError("503"))

    with pytest.raises(GenerationError):
        [c async for c in stream_chat_response("q", "sys", [])]


# --- Scenes ---------------------------------------------------------------------


def feasible(scene=VALID_SCENE):
    return json.dumps({"feasible": True, "reason": "", "scene": scene})


@pytest.mark.asyncio
async def test_a_scene_is_generated_from_the_conversation(mock_genai_client):
    mock_genai_client.aio.models.generate_content.return_value = response(feasible())

    result = await generate_scene(CONTEXT, language="java")

    assert isinstance(result, SceneResult) and result.feasible
    kwargs = mock_genai_client.aio.models.generate_content.call_args.kwargs
    assert kwargs["config"].response_schema is SceneResult
    assert "java" in kwargs["config"].system_instruction
    assert CONTEXT in kwargs["contents"][0].parts[0].text


@pytest.mark.asyncio
async def test_traces_use_the_scene_model_not_the_answer_model(mock_genai_client):
    """Generated only on click, so it can afford the stronger model."""
    mock_genai_client.aio.models.generate_content.return_value = response(feasible())
    await generate_scene(CONTEXT)
    used = mock_genai_client.aio.models.generate_content.call_args.kwargs["model"]
    assert used == SCENE_MODEL


@pytest.mark.asyncio
async def test_a_saved_specific_trace_is_still_honoured(mock_genai_client):
    mock_genai_client.aio.models.generate_content.return_value = response(feasible())
    await generate_scene(CONTEXT, trace=TRACE)
    text = mock_genai_client.aio.models.generate_content.call_args.kwargs["contents"][0].parts[0].text
    assert "nums=[2,7], target=9" in text


@pytest.mark.asyncio
async def test_declining_is_a_normal_result(mock_genai_client):
    mock_genai_client.aio.models.generate_content.return_value = response(
        json.dumps({"feasible": False, "reason": "This is a proof, not a process."})
    )
    result = await generate_scene(CONTEXT)
    assert not result.feasible and result.reason == "This is a proof, not a process."
    assert mock_genai_client.aio.models.generate_content.await_count == 1


@pytest.mark.asyncio
async def test_repairable_slips_are_fixed_without_a_retry(mock_genai_client):
    """An out-of-range code line used to fail the whole scene."""
    sloppy = dict(VALID_SCENE, steps=[dict(VALID_SCENE["steps"][0], code_line=40)])
    mock_genai_client.aio.models.generate_content.return_value = response(feasible(sloppy))

    result = await generate_scene(CONTEXT)

    assert result.scene.steps[0].code_line is None
    assert mock_genai_client.aio.models.generate_content.await_count == 1


@pytest.mark.asyncio
async def test_an_unrepairable_result_is_retried_with_the_error(mock_genai_client):
    blank = dict(VALID_SCENE, steps=[dict(VALID_SCENE["steps"][0], explanation="  ")])
    mock_genai_client.aio.models.generate_content.side_effect = [
        response(feasible(blank)),
        response(feasible()),
    ]

    result = await generate_scene(CONTEXT)

    assert result.feasible
    retry = mock_genai_client.aio.models.generate_content.call_args.kwargs["contents"]
    assert [c.role for c in retry] == ["user", "model", "user"]
    assert "no explanation" in retry[-1].parts[0].text


@pytest.mark.asyncio
async def test_two_unusable_results_give_up_with_a_readable_error(mock_genai_client):
    mock_genai_client.aio.models.generate_content.return_value = response("{not json")

    with pytest.raises(GenerationError, match="valid visualization"):
        await generate_scene(CONTEXT)
    assert mock_genai_client.aio.models.generate_content.await_count == 2


@pytest.mark.asyncio
async def test_an_unavailable_model_is_reported(mock_genai_client):
    mock_genai_client.aio.models.generate_content.side_effect = RuntimeError("down")

    with pytest.raises(GenerationError, match="unavailable"):
        await generate_scene(CONTEXT)


# --- Fallbacks when a way of asking is refused -------------------------------
#
# Production showed "The visualization service is unavailable right now" on
# every click: the API refused the structured-output request outright. These
# pin down the fallbacks that replaced giving up.


@pytest.mark.asyncio
async def test_a_refused_schema_falls_back_to_plain_json(mock_genai_client):
    mock_genai_client.aio.models.generate_content.side_effect = [
        RuntimeError("400 INVALID_ARGUMENT: schema produces too many states"),
        response(feasible()),
    ]

    result = await generate_scene(CONTEXT)

    assert result.feasible
    second = mock_genai_client.aio.models.generate_content.call_args_list[1].kwargs
    assert second["model"] == SCENE_MODEL
    assert second["config"].response_schema is None
    assert "JSON Schema" in second["config"].system_instruction


@pytest.mark.asyncio
async def test_a_missing_scene_model_goes_straight_to_the_answer_model(mock_genai_client):
    """Skip a model that 404s.

    A 404 means the model doesn't exist for this key; asking it again in JSON
    mode (as the first fallback did) only adds a wasted round trip.
    """
    mock_genai_client.aio.models.generate_content.side_effect = [
        RuntimeError("404 NOT_FOUND. models/gemini-2.5-flash is no longer available to new users"),
        response(feasible()),
    ]

    result = await generate_scene(CONTEXT)

    assert result.feasible
    calls = mock_genai_client.aio.models.generate_content.call_args_list
    assert len(calls) == 2
    assert calls[1].kwargs["model"] == ANSWER_MODEL


@pytest.mark.asyncio
async def test_only_when_every_way_is_refused_is_it_unavailable(mock_genai_client):
    mock_genai_client.aio.models.generate_content.side_effect = RuntimeError("403")

    with pytest.raises(GenerationError, match="unavailable"):
        await generate_scene(CONTEXT)
    # Schema then JSON on the first model, JSON on two more, then stop.
    assert mock_genai_client.aio.models.generate_content.await_count == 4


@pytest.mark.asyncio
async def test_plain_json_wrapped_in_a_code_fence_is_accepted(mock_genai_client):
    mock_genai_client.aio.models.generate_content.side_effect = [
        RuntimeError("400 schema"),
        response("```json\n" + feasible() + "\n```"),
    ]
    assert (await generate_scene(CONTEXT)).feasible


# --- Transient failures (429/5xx) are retried ---------------------------------


def overloaded():
    return RuntimeError("503 UNAVAILABLE. This model is currently experiencing high demand.")


@pytest.mark.asyncio
async def test_an_overloaded_model_is_retried_before_falling_back(mock_genai_client, no_retry_pause):
    mock_genai_client.aio.models.generate_content.side_effect = [overloaded(), response(feasible())]

    result = await generate_scene(CONTEXT)

    assert result.feasible
    calls = mock_genai_client.aio.models.generate_content.call_args_list
    assert [c.kwargs["model"] for c in calls] == [SCENE_MODEL] * 2
    assert calls[1].kwargs["config"].response_schema is SceneResult  # same mode, not a fallback
    no_retry_pause.assert_awaited_once_with(1.0)


@pytest.mark.asyncio
async def test_retries_are_bounded(mock_genai_client, no_retry_pause):
    mock_genai_client.aio.models.generate_content.side_effect = overloaded()

    with pytest.raises(GenerationError, match="unavailable"):
        await generate_scene(CONTEXT)

    # Four ways of asking (see above), each tried three times (two retries).
    assert mock_genai_client.aio.models.generate_content.await_count == 12
    assert [c.args[0] for c in no_retry_pause.await_args_list[:2]] == [1.0, 3.0]


@pytest.mark.asyncio
async def test_a_permanent_error_is_not_retried(mock_genai_client, no_retry_pause):
    mock_genai_client.aio.models.generate_content.side_effect = [
        RuntimeError("400 INVALID_ARGUMENT"),
        response(feasible()),
    ]
    await generate_scene(CONTEXT)
    no_retry_pause.assert_not_awaited()


@pytest.mark.asyncio
async def test_the_answer_stream_is_retried_when_it_fails_before_any_text(mock_genai_client):
    async def chunks():
        yield MagicMock(text="hello")

    mock_genai_client.aio.models.generate_content_stream = AsyncMock(side_effect=[overloaded(), chunks()])

    out = [c async for c in stream_chat_response("q", "sys", [])]

    assert out == ["hello"]


@pytest.mark.asyncio
async def test_the_answer_stream_is_not_retried_after_text_was_sent(mock_genai_client):
    """A retry then would repeat text the user already has."""
    async def breaks_midway():
        yield MagicMock(text="half an ")
        raise overloaded()

    mock_genai_client.aio.models.generate_content_stream = AsyncMock(return_value=breaks_midway())

    out = []
    with pytest.raises(GenerationError):
        async for c in stream_chat_response("q", "sys", []):
            out.append(c)

    assert out == ["half an "]
    assert mock_genai_client.aio.models.generate_content_stream.await_count == 1


@pytest.mark.asyncio
async def test_intent_classification_survives_one_overload(mock_genai_client):
    gemini_integration._intent_cache.clear()
    mock_genai_client.aio.models.generate_content.side_effect = [overloaded(), response("cs_tutor")]

    assert await gemini_integration.classify_intent_with_llm("explain two sum") == "cs_tutor"


# --- Discovering models when the configured ones are gone ----------------------


@pytest.mark.asyncio
async def test_when_configured_models_are_refused_a_listed_model_is_used(mock_genai_client):
    """Model names get retired; the key's own model list is the last resort."""
    mock_genai_client.aio.models.list.return_value = pager([
        model("gemini-2.5-flash-lite"),
        model("gemini-9.1-flash"),
        model("gemini-9.1-flash-tts"),
        model("text-embedding-004", actions=("embedContent",)),
        model("gemini-9.1-pro"),
    ])
    mock_genai_client.aio.models.generate_content.side_effect = [
        RuntimeError("404 retired"),  # the pinned scene model
        response(feasible()),
    ]

    result = await generate_scene(CONTEXT)

    assert result.feasible
    used = [c.kwargs["model"] for c in mock_genai_client.aio.models.generate_content.call_args_list]
    # Newest listed full flash; tts, embedding and pro models are skipped.
    assert used == [SCENE_MODEL, "gemini-9.1-flash"]


@pytest.mark.asyncio
async def test_a_failed_model_listing_still_reports_unavailable(mock_genai_client):
    mock_genai_client.aio.models.list.side_effect = RuntimeError("403")
    mock_genai_client.aio.models.generate_content.side_effect = RuntimeError("404 gone")
    with pytest.raises(GenerationError, match="unavailable"):
        await generate_scene(CONTEXT)


@pytest.mark.asyncio
async def test_overload_is_named_as_the_cause(mock_genai_client):
    mock_genai_client.aio.models.generate_content.side_effect = RuntimeError("503 high demand")
    with pytest.raises(GenerationError, match="overloaded"):
        await generate_scene(CONTEXT)


@pytest.mark.asyncio
async def test_the_error_names_what_google_returned(mock_genai_client):
    mock_genai_client.aio.models.generate_content.side_effect = RuntimeError("403 API key not valid")
    with pytest.raises(GenerationError, match="403.*GEMINI_API_KEY"):
        await generate_scene(CONTEXT)


@pytest.mark.asyncio
async def test_an_unreachable_api_is_named(mock_genai_client):
    mock_genai_client.aio.models.generate_content.side_effect = OSError("connection refused")
    with pytest.raises(GenerationError, match="couldn't reach"):
        await generate_scene(CONTEXT)


# --- Answers and intent move past a retired model ------------------------------
#
# Production: gemini-2.5-flash-lite started returning 404 "no longer available
# to new users", and every chat answer failed.

RETIRED = RuntimeError(
    "404 NOT_FOUND. This model models/answer-model is no longer available to new users. "
    "Please update your code to use models/gemini-3.5-flash-lite for the latest features."
)


@pytest.mark.asyncio
async def test_the_answer_stream_switches_model_on_a_404(mock_genai_client):
    async def chunks():
        yield MagicMock(text="hello")

    mock_genai_client.aio.models.generate_content_stream = AsyncMock(side_effect=[RETIRED, chunks()])

    out = [c async for c in stream_chat_response("q", "sys", [])]

    assert out == ["hello"]
    calls = mock_genai_client.aio.models.generate_content_stream.call_args_list
    # The model the 404 message names is tried next.
    assert [c.kwargs["model"] for c in calls] == [ANSWER_MODEL, "gemini-3.5-flash-lite"]


@pytest.mark.asyncio
async def test_a_learned_replacement_is_used_first_next_time(mock_genai_client):
    async def chunks():
        yield MagicMock(text="ok")

    mock_genai_client.aio.models.generate_content_stream = AsyncMock(
        side_effect=[RETIRED, chunks(), chunks()]
    )
    [c async for c in stream_chat_response("q", "sys", [])]
    [c async for c in stream_chat_response("q", "sys", [])]

    last = mock_genai_client.aio.models.generate_content_stream.call_args.kwargs["model"]
    assert last == "gemini-3.5-flash-lite"
    assert mock_genai_client.aio.models.generate_content_stream.await_count == 3


@pytest.mark.asyncio
async def test_intent_classification_moves_past_a_retired_model(mock_genai_client):
    gemini_integration._intent_cache.clear()
    mock_genai_client.aio.models.generate_content.side_effect = [RETIRED, response("cs_tutor")]

    assert await gemini_integration.classify_intent_with_llm("explain heaps") == "cs_tutor"
    used = mock_genai_client.aio.models.generate_content.call_args.kwargs["model"]
    assert used == "gemini-3.5-flash-lite"


@pytest.mark.asyncio
async def test_when_no_model_works_the_answer_fails_cleanly(mock_genai_client):
    mock_genai_client.aio.models.generate_content_stream = AsyncMock(
        side_effect=RuntimeError("404 NOT_FOUND gone")
    )
    with pytest.raises(GenerationError):
        [c async for c in stream_chat_response("q", "sys", [])]
