# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
import logging
from typing import Dict, Any, Optional

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set.")

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

app = FastAPI(title="AI Chatbot Backend")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash-8b")


class ChatRequest(BaseModel):
    user_input: str


class ChatResponse(BaseModel):
    bot_response: str
    visualization_data: Optional[Dict[str, Any]] = None  # Optional visualization data
    response_type: str = "text"  # Default response type is "text"


# --- Visualization Data Generation (Example for Bubble Sort) ---
def generate_bubble_sort_data():
    """
    In a real application, you would implement the bubble sort algorithm,
    recording each step of the sort. Here, we return dummy data.
    """
    return {
        "visualizationType": "sorting",
        "algorithm": "bubble_sort",
        "steps": [
            {"array": [5, 3, 8, 6], "message": "Initial array"},
            {"array": [3, 5, 8, 6], "message": "Step 1: Compare 5 and 3, swap"},
            {"array": [3, 5, 6, 8], "message": "Step 2: Continue sorting..."},
            {"array": [3, 5, 6, 8], "message": "Sorted array"},
        ],
    }


# --- Visualization Data Generation (Example for Binary Tree) ---
def generate_binary_tree_data():
    """Placeholder for binary tree visualization data generation."""
    return {
        "visualizationType": "tree",
        "structure": "binary_tree",
        "nodes": [
            {"id": "A", "value": 10, "children": ["B", "C"]},
            {"id": "B", "value": 5, "children": ["D", "E"]},
            {"id": "C", "value": 15, "children": []},
            {"id": "D", "value": 2, "children": []},
            {"id": "E", "value": 7, "children": []},
        ],
        "layout": "hierarchical",
    }


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest):
    user_input = chat_request.user_input.strip()
    if not user_input:
        raise HTTPException(status_code=400, detail="Input cannot be empty.")
    logging.info(f"User Input: {user_input}")

    # Check if the user request includes visualization intent
    visualization_response_data = None
    visualization_requested = False
    if any(kw in user_input.lower() for kw in ["visualize", "show me", "draw"]):
        if "bubble sort" in user_input.lower():
            visualization_response_data = generate_bubble_sort_data()
            visualization_requested = True
        elif "binary tree" in user_input.lower():
            visualization_response_data = generate_binary_tree_data()
            visualization_requested = True
        # You can add more visualization types here if needed

    # Always call the Gemini API to generate a text response
    try:
        response = model.generate_content(user_input)
        bot_response_text = response.text
        if not bot_response_text:
            bot_response_text = "Sorry, I couldn't generate a response."
        logging.info(f"Bot Response: {bot_response_text}")
    except Exception as e:
        logging.error(f"Error during Gemini API call: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error communicating with AI service: {e}"
        )

    # If visualization was requested and data is available, return it along with the text response
    if visualization_requested and visualization_response_data:
        return {
            "bot_response": bot_response_text,
            "visualization_data": visualization_response_data,
            "response_type": "visualization",
        }
    else:
        return {
            "bot_response": bot_response_text,
            "response_type": "text",
        }


@app.get("/health")
async def health_check():
    return {"status": "OK"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
