import os
import re
import json
import time
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s - {%(pathname)s:%(lineno)d}",
    handlers=[logging.StreamHandler(), logging.FileHandler("app.log")],
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.critical("GEMINI_API_KEY environment variable not set")
    raise ValueError("GEMINI_API_KEY environment variable not set.")

# Initialize FastAPI app
app = FastAPI(title="AI Chatbot Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# System Prompts
VISUALIZATION_PROMPT = """You are an AI specialized in generating data-structure and algorithm visualizations.

Your task is to output ONLY a single valid JSON object with no additional text, markdown formatting, code fences, or explanations. Do not include any extra characters or line breaks outside the JSON syntax.

Below are the supported visualization types and their required JSON structures:

1. Sorting Algorithm Visualizations (e.g., bubble sort):
{
  "visualizationType": "sorting",
  "algorithm": "<algorithm_name>",  // e.g., "bubble_sort"
  "steps": [
    {
      "array": [4, 2, 7, 1],
      "message": "Initial array"
    },
    {
      "array": [2, 4, 7, 1],
      "message": "Swapped 4 and 2"
    }
    // Additional steps as needed...
  ]
}

2. Tree Visualizations (e.g., binary tree):
{
  "visualizationType": "tree",
  "structure": "binary_tree",
  "nodes": [
    { "id": "A", "value": "A", "children": ["B", "C"] },
    { "id": "B", "value": "B", "children": ["D"] },
    { "id": "C", "value": "C", "children": [] },
    { "id": "D", "value": "D", "children": [] }
  ],
  "layout": "hierarchical"
}

3. Graph Visualizations (for traversals or algorithms like DFS, BFS, Dijkstra, Prim, Kruskal, etc.):
{
  "visualizationType": "graph",
  "algorithm": "<algorithm_name>",  // e.g., "dfs", "bfs", "dijkstra"
  "nodes": [
    { "id": "A", "label": "A" },
    { "id": "B", "label": "B" },
    { "id": "C", "label": "C" },
    // More nodes as needed...
  ],
  "edges": [
    { "source": "A", "target": "B", "weight": 5 },  // weight is optional if not applicable
    { "source": "A", "target": "C" },
    // More edges as needed...
  ],
  "steps": [
    {
      "visitedNodes": ["A", "B"],
      "currentNode": "B",
      "message": "Visited A then B"
    }
    // Additional steps as needed...
  ]
}

4. Stack Visualizations:
{
  "visualizationType": "stack",
  "stack": ["element1", "element2", "element3"]
}

5. Queue Visualizations:
{
  "visualizationType": "queue",
  "queue": ["element1", "element2", "element3"]
}

6. Hash Map Visualizations:
{
  "visualizationType": "hashmap",
  "hashmap": { "key1": "value1", "key2": "value2" }
}

Rules:
- Output ONLY the JSON exactly as specified above. Do not include any markdown (no triple backticks), headings, or extra text.
- If the input prompt does not request a visualization, output exactly: {}
- Ensure the JSON is properly formatted, with no trailing commas or extra whitespace.
- All messages must be clear and concise.

Now, generate the JSON output strictly following the structure above based on the input prompt.

"""


CS_TUTOR_PROMPT = """You are a knowledgeable computer science tutor. Explain concepts, algorithms, and data structures clearly. Provide examples and break down complex ideas. Focus on fundamental principles and practical applications."""

GENERAL_PROMPT = """You are a helpful AI assistant. Respond to questions politely and informatively. Keep answers concise and relevant to the query."""

# Generation configurations
visualization_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
}

chat_config = {
    "temperature": 0.65,
    "top_p": 0.9,
    "top_k": 20,
    "max_output_tokens": 2048,
}

# Initialize models
visualization_model = genai.GenerativeModel(
    "gemini-1.5-flash-8b",
    generation_config=visualization_config,
)
chat_model = genai.GenerativeModel(
    "gemini-1.5-flash-8b",
    generation_config=chat_config,
)


def classify_intent(query: str) -> str:
    """Determine the intent of the user query."""
    query_lower = query.lower()
    vis_keywords = {"visualize", "show", "steps", "algorithm", "sort", "tree", "graph"}
    cs_keywords = {
        "computer science",
        "data structure",
        "algorithm",
        "explain",
        "how to",
        "example",
    }

    if any(kw in query_lower for kw in vis_keywords):
        return "visualization"
    if any(kw in query_lower for kw in cs_keywords):
        return "cs_tutor"
    return "general"


def clean_json_response(raw_text: str) -> str:
    """Extract JSON from model response."""
    text = re.sub(r"```json\s*", "", raw_text)
    text = re.sub(r"```\s*$", "", text)
    return text.strip()


def get_visualization_data(user_query: str) -> Optional[Dict[str, Any]]:
    """Generate visualization data."""
    try:
        chat_session = visualization_model.start_chat()
        response = chat_session.send_message(VISUALIZATION_PROMPT + "\n\n" + user_query)
        cleaned_text = clean_json_response(response.text)
        return json.loads(cleaned_text) if cleaned_text else None
    except Exception as e:
        logger.error(f"Visualization error: {str(e)}")
        return None


def get_chat_response(user_query: str, system_prompt: str) -> str:
    """Generate contextual text response."""
    try:
        response = chat_model.generate_content(
            system_prompt + "\n\nUser Query: " + user_query
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return "I couldn't generate a response. Please try again."


# Request/Response Models
class ChatRequest(BaseModel):
    user_input: str


class ChatResponse(BaseModel):
    bot_response: str
    visualization_data: Optional[Dict[str, Any]] = None
    response_type: str = "text"


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest):
    user_input = chat_request.user_input.strip()
    if not user_input:
        raise HTTPException(status_code=400, detail="Empty input")

    # Determine intent and select system prompt
    intent = classify_intent(user_input)
    visualization_data = None
    system_prompt = GENERAL_PROMPT

    if intent == "visualization":
        visualization_data = get_visualization_data(user_input)
        system_prompt = CS_TUTOR_PROMPT
    elif intent == "cs_tutor":
        system_prompt = CS_TUTOR_PROMPT

    # Generate text response
    bot_response = get_chat_response(user_input, system_prompt)

    return {
        "bot_response": bot_response,
        "visualization_data": visualization_data,
        "response_type": "visualization" if visualization_data else "text",
    }


@app.get("/health")
async def health_check():
    return {"status": "OK"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
