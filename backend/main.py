from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set. Please create a .env file and set it.")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI(title="AI Chatbot Backend")

# CORS configuration to allow requests from the frontend origin (adjust as needed)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",  # Default React development server port
    "http://localhost:8000",  # Default FastAPI development server port (if frontend served from backend)
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    # Add other origins as needed (e.g., your deployed frontend domain)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini API with API key
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(
    "gemini-1.5-flash-8b"
)  # Or 'gemini-pro-vision' for multimodal


class ChatRequest(BaseModel):
    user_input: str

class ChatResponse(BaseModel):
    bot_response: str

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: Request, chat_request: ChatRequest):
    """
    Endpoint to handle chat requests and return Gemini API responses.
    """
    user_input = chat_request.user_input.strip()

    if not user_input:
        logging.warning("Empty user input received.")
        raise HTTPException(status_code=400, detail="Input cannot be empty.")

    logging.info(f"User Input: {user_input}")

    try:
        response = model.generate_content(user_input)
        bot_response_text = response.text

        if not bot_response_text:
            logging.warning("Gemini API returned an empty response.")
            bot_response_text = "Sorry, I couldn't generate a response. Please try again." # Fallback message

        logging.info(f"Bot Response: {bot_response_text}")
        return {"bot_response": bot_response_text}

    except Exception as e:
        logging.error(f"Error during Gemini API call: {e}")
        raise HTTPException(status_code=500, detail=f"Error communicating with AI service: {e}")


@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the backend is running.
    """
    return {"status": "OK"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
