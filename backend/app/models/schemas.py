from pydantic import BaseModel

class ResearchRequest(BaseModel):
    query: str

class ResearchResponse(BaseModel):
    plan: str
    final_report: str
    approved: bool
    critique: str