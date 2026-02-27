from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import research

app = FastAPI(
    title="Multi-Agent Research Engine",
    description="LangGraph-powered research system with Planner → Researcher → Critic → Writer pipeline",
    version="1.0.0"
)

# Allow React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(research.router)

@app.get("/")
async def root():
    return {
        "message": "Research Agent API running",
        "docs": "/docs",
        "graph": "Planner → Researcher (loop) → Critic → Writer"
    }