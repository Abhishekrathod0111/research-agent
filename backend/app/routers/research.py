from fastapi import APIRouter
from app.models.schemas import ResearchRequest, ResearchResponse
from app.graph.graph import research_graph
from app.db.database import save_research

router = APIRouter()

@router.post("/run")
async def run_research(request: ResearchRequest):
    result = await research_graph.ainvoke({
        "query": request.query,
        "sub_tasks": [],
        "plan": "",
        "research_results": [],
        "critique": "",
        "approved": False,
        "final_report": "",
        "current_agent": "",
        "error": ""
    })

    await save_research(
        query=request.query,
        plan=result.get("plan", ""),
        final_report=result.get("final_report", ""),
        approved=result.get("approved", False),
        critique=result.get("critique", "")
    )

    return ResearchResponse(
        plan=result.get("plan", ""),
        final_report=result.get("final_report", ""),
        approved=result.get("approved", False),
        critique=result.get("critique", "")
    )