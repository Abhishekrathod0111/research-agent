import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"  # Best free model on Groq right now

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY missing in .env")
if not TAVILY_API_KEY:
    raise ValueError("TAVILY_API_KEY missing in .env")

