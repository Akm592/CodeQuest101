import asyncio
import json
import re
import time
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

from google import genai
from google.genai import types
from pydantic import ValidationError

from app.core.config import settings
from app.core.logger import logger
from app.llm.models import ANSWER, SCENE, ModelResolver
from app.llm.prompts import INTENT_CLASSIFICATION_PROMPT, SCENE_PROMPT
from app.schemas.visualization_schemas import SceneResult, TraceRequest

client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Which model to call is decided at runtime; see app/llm/models.py. The
# lambda looks `client` up on each call, so tests can patch it.
resolver = ModelResolver(lambda: client.aio.models.list())

# How many different models one request may try before giving up.
MAX_MODELS_PER_REQUEST = 3


class GenerationError(Exception):
    """The model could not produce a usable answer. The message is safe to show."""


# Statuses that mean "try again shortly": rate limited or overloaded. Google
# returns 503 "This model is currently experiencing high demand... usually
# temporary" during spikes, and treating that as final failed requests that a
# second attempt would have served.
TRANSIENT_STATUSES = {429, 500, 503, 504}
RETRY_DELAYS_S = (1.0, 3.0)


def _status(error: Exception) -> Optional[int]:
    """Return an API error's HTTP status: its ``code``, else a leading "503 ..."."""
    code = getattr(error, "code", None)
    if isinstance(code, int):
        return code
    match = re.match(r"\s*(\d{3})\b", str(error))
    return int(match.group(1)) if match else None


# Scenes have other models to fall back on, so an overloaded one gets a single
# quick retry before the next model is tried.
SCENE_RETRY_DELAYS_S = (1.0,)


async def _generate(
    model: str,
    contents: Any,
    config: types.GenerateContentConfig,
    label: str,
    delays: Tuple[float, ...] = RETRY_DELAYS_S,
):
    """Call generate_content, retrying transient failures with a short backoff."""
    for attempt, delay in enumerate((*delays, None)):
        try:
            return await client.aio.models.generate_content(
                model=model, contents=contents, config=config
            )
        except Exception as e:
            status = _status(e)
            if status not in TRANSIENT_STATUSES or delay is None:
                raise
            logger.warning(f"{label}: {model} returned {status}; retry {attempt + 1} in {delay:.0f}s")
            await asyncio.sleep(delay)


async def _each_model(role: str) -> AsyncGenerator[str, None]:
    """Yield models to try for ``role``, re-asking the resolver after each.

    Re-asking matters: a 404 can teach the resolver a replacement, which then
    comes next.
    """
    tried: set = set()
    while len(tried) < MAX_MODELS_PER_REQUEST:
        nxt = [m for m in await resolver.candidates(role) if m not in tried]
        if not nxt:
            return
        tried.add(nxt[0])
        yield nxt[0]


chat_config_defaults = dict(
    temperature=0.8,
    top_p=0.9,
    top_k=20,
    max_output_tokens=10000,
)

# Faster, more deterministic config for classification
classification_config = types.GenerateContentConfig(
    temperature=0.0,
    top_p=0.95,
    top_k=40,
    max_output_tokens=100,
)

# Simple in-memory cache for intent classification
_intent_cache: Dict[str, str] = {}
MAX_CACHE_SIZE = 100

# How much of the conversation the scene call sees.
MAX_CONTEXT_CHARS = 6000


def _history_contents(chat_history: Optional[List[Dict[str, str]]]) -> List[types.Content]:
    contents = []
    for msg in chat_history or []:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))
    return contents


async def stream_chat_response(
    user_query: str, system_prompt: str, chat_history: List[Dict[str, str]] = None
) -> AsyncGenerator[str, None]:
    """Stream text response chunks with chat history.

    The system prompt goes in ``system_instruction``. It used to be sent as the
    first *user* turn, which the model treats as something the user said and can
    answer, quote or argue with.

    Raises ``GenerationError`` if the model fails, so the caller can send an
    error event instead of saving "Error generating response." as the answer.
    """
    contents = _history_contents(chat_history)
    contents.append(types.Content(role="user", parts=[types.Part(text=user_query)]))
    config = types.GenerateContentConfig(
        **chat_config_defaults,
        system_instruction=system_prompt or None,
    )

    last_error: Optional[Exception] = None
    async for model in _each_model(ANSWER):
        for attempt, delay in enumerate((*RETRY_DELAYS_S, None)):
            sent = False
            try:
                response = await client.aio.models.generate_content_stream(
                    model=model,
                    contents=contents,
                    config=config,
                )
                async for chunk in response:
                    if chunk.text:
                        sent = True
                        yield chunk.text
                return
            except Exception as e:
                last_error = e
                status = _status(e)
                # After the first chunk, retrying or switching model would
                # repeat text the user already has.
                if sent:
                    logger.error(f"Streaming error after text was sent: {e}")
                    raise GenerationError("The model could not generate a response.") from e
                if status in TRANSIENT_STATUSES and delay is not None:
                    logger.warning(f"Answer: {model} returned {status}; retry {attempt + 1} in {delay:.0f}s")
                    await asyncio.sleep(delay)
                    continue
                if status == 404:
                    resolver.mark_missing(model, ANSWER, e)
                    break  # next model
                if status in TRANSIENT_STATUSES:
                    resolver.cool_down(model)
                    break  # still overloaded after retries: next model
                logger.error(f"Streaming error: {e}")
                raise GenerationError("The model could not generate a response.") from e

    logger.error(f"No model could answer: {last_error}")
    raise GenerationError("The model could not generate a response.") from last_error


def _scene_request_text(context: str, trace: Optional[TraceRequest]) -> str:
    text = f"The conversation:\n{context[:MAX_CONTEXT_CHARS]}\n"
    if trace is not None:
        # Suggestions saved by the first version named a specific trace.
        text += (
            f"\nTrace specifically: {trace.problem}, on input {trace.input}, "
            f"using {trace.approach}.\n"
        )
    return text


# The JSON Schema the plain-JSON fallback asks for in words. Built once.
_SCENE_JSON_SCHEMA = json.dumps(SceneResult.model_json_schema(), separators=(",", ":"))


def _scene_config(language: str, structured: bool) -> types.GenerateContentConfig:
    instruction = SCENE_PROMPT.replace("{language}", language)
    if structured:
        return types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=16000,
            system_instruction=instruction,
            response_mime_type="application/json",
            response_schema=SceneResult,
        )
    return types.GenerateContentConfig(
        temperature=0.3,
        max_output_tokens=16000,
        system_instruction=(
            instruction
            + "\n\nReturn ONLY a JSON object matching this JSON Schema "
            + "(no markdown, no commentary):\n"
            + _SCENE_JSON_SCHEMA
        ),
        response_mime_type="application/json",
    )


class _Invalid:
    """Two answers came back, neither a valid scene."""

    def __init__(self, reason: Optional[str]):
        self.reason = reason


async def _try_scene(model, structured, mode, request, language):
    """One way of asking: a SceneResult, an _Invalid, or the refusal exception."""
    config = _scene_config(language, structured)
    contents: List[types.Content] = [request]
    last_invalid: Optional[str] = None
    for repair in range(2):
        try:
            response = await _generate(model, contents, config, "Scene", SCENE_RETRY_DELAYS_S)
        except Exception as e:
            logger.error(f"Scene generation call failed with {mode}: {e}")
            return e

        raw = response.text or ""
        try:
            # Validate from the raw JSON rather than trusting
            # `response.parsed`: the SDK skips Pydantic validators when
            # parsing fails, and the repairs live in those validators.
            result = SceneResult.model_validate_json(_strip_fences(raw))
        except ValidationError as e:
            last_invalid = "; ".join(err["msg"] for err in e.errors()[:5])
            logger.info(f"Scene from {mode}, attempt {repair + 1}, invalid: {last_invalid}")
            contents = [
                request,
                types.Content(role="model", parts=[types.Part(text=raw[:20000])]),
                types.Content(
                    role="user",
                    parts=[types.Part(text=(
                        f"That result is invalid: {last_invalid}. "
                        "Return the corrected complete result."
                    ))],
                ),
            ]
            continue

        if result.scene is not None and result.scene._repairs:
            logger.info(f"Scene from {mode} repaired: {'; '.join(result.scene._repairs)}")
        logger.info(f"Scene generated with {mode}.")
        return result
    return _Invalid(last_invalid)


async def generate_scene(
    context: str, trace: Optional[TraceRequest] = None, language: str = "python"
) -> SceneResult:
    """Trace the conversation's solution, or explain why it can't be traced.

    Called only when the user clicks "Visualize this", so nothing is spent on
    answers whose button is never pressed. The model may decline
    (``feasible: false``) rather than invent an example the problem doesn't
    support. Small inconsistencies are repaired by the ``Scene`` validator;
    only problems it can't repair are sent back once with the error.

    If a call is *refused* (schema rejected, model unavailable), the next way
    of asking is tried, then the next model the resolver offers.
    """
    request = types.Content(role="user", parts=[types.Part(text=_scene_request_text(context, trace))])
    refusals: List[str] = []
    statuses: List[Optional[int]] = []
    first = True

    async for model in _each_model(SCENE):
        # Structured output first, on the first model only: the API can refuse
        # a schema it thinks too large, and plain JSON mode with the schema in
        # the instructions avoids that. Later models go straight to JSON mode.
        modes = (True, False) if first else (False,)
        first = False
        for structured in modes:
            mode = f"{model} ({'schema' if structured else 'json'})"
            outcome = await _try_scene(model, structured, mode, request, language)
            if isinstance(outcome, SceneResult):
                return outcome
            if isinstance(outcome, _Invalid):
                # Both tries answered but neither was usable: asking another
                # way won't help a model that understood the request.
                raise GenerationError(f"Couldn't build a valid visualization ({outcome.reason}).")
            refusals.append(f"{mode}: {outcome}")
            statuses.append(_status(outcome))
            status = _status(outcome)
            if status == 404:
                resolver.mark_missing(model, SCENE, outcome)
                break  # this model doesn't exist; another mode won't help
            if status in TRANSIENT_STATUSES:
                resolver.cool_down(model)
                break  # overloaded; another mode of the same model won't help

    logger.error(f"Every way of generating a scene was refused: {' | '.join(refusals)}")
    if statuses and all(s in TRANSIENT_STATUSES for s in statuses):
        raise GenerationError(
            "The visualization service is unavailable right now: Google's models are "
            "overloaded. Try again in a minute."
        )
    raise GenerationError(f"The visualization service is unavailable right now ({_cause(statuses)}).")


def _cause(statuses: List[Optional[int]]) -> str:
    """Name what Google said, so the message in the app shows the cause."""
    codes = sorted({s for s in statuses if s is not None})
    if not codes:
        return "couldn't reach Google's API"
    hint = ""
    if any(c in (400, 401, 403) for c in codes):
        hint = ": check GEMINI_API_KEY on the server"
    elif 404 in codes:
        hint = ": the model names aren't available to this key"
    return "Google returned " + ", ".join(map(str, codes)) + hint


def _strip_fences(raw: str) -> str:
    """Drop a ```json fence, which plain JSON mode occasionally adds anyway."""
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else ""
        text = text.rsplit("```", 1)[0]
    return text


async def _intent_call(prompt: str):
    """Ask the answer model, moving past models that 404."""
    last_error: Optional[Exception] = None
    async for model in _each_model(ANSWER):
        try:
            return await _generate(model, prompt, classification_config, "Intent")
        except Exception as e:
            last_error = e
            status = _status(e)
            if status == 404:
                resolver.mark_missing(model, ANSWER, e)
            elif status in TRANSIENT_STATUSES:
                resolver.cool_down(model)
            else:
                raise
    raise last_error or GenerationError("No model is available.")


async def classify_intent_with_llm(user_query: str) -> str:
    """Use the LLM to classify the user's intent with in-memory caching."""
    # Normalize query for better cache hits
    normalized_query = user_query.strip().lower()

    # Check cache first
    if normalized_query in _intent_cache:
        logger.info(f"Cache hit for intent: '{normalized_query[:30]}...' -> {_intent_cache[normalized_query]}")
        return _intent_cache[normalized_query]

    try:
        start_time = time.perf_counter()
        prompt = INTENT_CLASSIFICATION_PROMPT.format(user_query=user_query)

        response = await _intent_call(prompt)

        intent = response.text.strip().lower()
        duration = time.perf_counter() - start_time

        if intent in ["visualization", "cs_tutor", "general"]:
            logger.info(f"LLM classified intent for '{user_query[:60]}...' as: {intent} (took {duration:.2f}s)")

            # Update cache (simple FIFO-ish pruning if it gets too big)
            if len(_intent_cache) >= MAX_CACHE_SIZE:
                oldest_key = next(iter(_intent_cache))
                del _intent_cache[oldest_key]

            _intent_cache[normalized_query] = intent
            return intent
        else:
            logger.warning(f"LLM returned an invalid intent classification: '{intent}'. Defaulting to 'general'.")
            return "general"

    except Exception as e:
        logger.error(f"Error during LLM intent classification: {e}. Defaulting to 'general'.")
        return "general"
