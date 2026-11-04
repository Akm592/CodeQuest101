# Health check endpoint
import os

from fastapi import APIRouter

from app.core.config import settings
from app.llm.gemini_integration import resolver

router = APIRouter()


@router.get("/health")
async def health_check():
    """Return the health status, the deployed commit and the models in use."""
    # Render sets RENDER_GIT_COMMIT; it shows which code is live.
    return {
        "status": "OK",
        "commit": os.getenv("RENDER_GIT_COMMIT", "")[:7],
        "models": await resolver.current(),
        "gemini_key_set": bool(settings.GEMINI_API_KEY),
    }
