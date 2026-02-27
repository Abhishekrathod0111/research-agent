from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.graph.graph import research_graph

router = APIRouter(prefix="/research", tags=["Research"])


class ResearchRequest(BaseModel):
    query: str


class ResearchResponse(BaseModel):
    query: str
    plan: str
    final_report: str
    approved: bool
    critique: str


@router.post("/run", response_model=ResearchResponse)
async def run_research(request: ResearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=422, detail="Query cannot be empty")

    try:
        # This runs the entire graph start to finish
        result = await research_graph.ainvoke({
            "query": request.query,
            "sub_tasks": [],
            "plan": "",
            "research_results": [],
            "critique": "",
            "approved": False,
            "final_report": "",
            "current_agent": "starting",
            "error": ""
        })

        return ResearchResponse(
            query=result["query"],
            plan=result["plan"],
            final_report=result["final_report"],
            approved=result["approved"],
            critique=result["critique"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    return {"status": "ok"}