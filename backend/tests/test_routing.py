"""Which messages go to the LeetCode flow, and which language they name."""

import pytest

from app.api.chat import (
    detect_language,
    is_intended_leetcode_match,
    language_of_code,
    should_look_up_leetcode,
)

BINARY_SEARCH = {"title": "Binary Search", "slug": "binary-search"}
TWO_SUM = {"title": "Two Sum", "slug": "two-sum"}


@pytest.mark.parametrize(
    "message",
    ["explain binary search", "what is binary search?", "how does binary search work"],
)
def test_a_concept_question_is_not_hijacked_by_a_matching_title(message):
    assert not is_intended_leetcode_match(message, BINARY_SEARCH)


@pytest.mark.parametrize(
    "message",
    [
        "two sum",
        "Two Sum in java",
        "solve binary search",
        "leetcode 704",
        "704",
        "#1",
        "1. Two Sum",
        "problem 1",
        "https://leetcode.com/problems/two-sum/",
        "give me the solution to two sum",
    ],
)
def test_a_problem_request_is_accepted(message):
    assert is_intended_leetcode_match(message, TWO_SUM)


def test_a_message_starting_with_a_number_is_not_a_problem_number():
    assert not is_intended_leetcode_match("3 ways to reverse a list", {"title": "Longest Substring"})


def test_long_messages_without_a_signal_skip_the_lookup():
    assert not should_look_up_leetcode(
        "can you explain how a hash map handles collisions when two keys land in one bucket"
    )
    assert should_look_up_leetcode("two sum")


@pytest.mark.parametrize(
    "message",
    ["solve two sum, go step by step", "explain a, b, c", "let's go", "I want to go deeper"],
)
def test_common_words_are_not_languages(message):
    assert detect_language(message) is None


@pytest.mark.parametrize(
    "message, language",
    [
        ("two sum in go", "go"),
        ("write it in c", "c"),
        ("c code please", "c"),
        ("golang please", "go"),
        ("go", "go"),
        ("in java, not python", "java"),
    ],
)
def test_languages_named_as_languages(message, language):
    assert detect_language(message) == language


def test_the_code_block_language_wins_for_scenes():
    answer = "Unlike Python, Java needs types.\n```java\nint x = 1;\n```"
    assert language_of_code(answer) == "java"
    assert language_of_code("no code here") is None
