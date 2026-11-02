"""The scene format, checked from the backend's side against the frontend's fixtures.

The frontend draws scenes and the backend produces them, and they agree on
the wire format only by convention. The fixtures in
frontend/src/lib/scene/fixtures are what the frontend's tests and UI checker
draw; validating them with the backend's own model means a change on either
side that breaks the other fails CI, instead of production.

This could only be run by hand while the two lived in separate repositories.
"""

import json
from pathlib import Path

import pytest

from app.schemas.visualization_schemas import Scene

FIXTURES = Path(__file__).resolve().parents[2] / "frontend" / "src" / "lib" / "scene" / "fixtures"


def fixture_files():
    return sorted(FIXTURES.glob("*.json"))


def test_the_fixtures_are_where_this_test_expects():
    assert fixture_files(), f"no scene fixtures found in {FIXTURES}"


@pytest.mark.parametrize("path", fixture_files(), ids=lambda p: p.stem)
def test_every_frontend_fixture_is_a_valid_backend_scene(path):
    scene = Scene.model_validate(json.loads(path.read_text()))
    # Fixtures are hand-checked traces; needing a repair means one side drifted.
    assert scene._repairs == [], f"{path.name} needed repairs: {scene._repairs}"
