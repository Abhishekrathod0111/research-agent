from fastapi import APIRouter
from app.db.database import get_history

router = APIRouter()

@router.get("/history")
async def get_research_history():
    history = await get_history(limit=20)
    return {"history": history}