from typing import Annotated
from typing_extensions import TypedDict
import operator


class ResearchState(TypedDict):
    """
    The shared state that flows through every agent in the graph.
    
    Annotated[list, operator.add] means:
    When multiple agents write to this field, their outputs get MERGED (not overwritten).
    This is how LangGraph handles parallel agent writes safely.
    """

    # Input
    query: str                              # The user's original question

    # Planner output
    sub_tasks: list[str]                    # ["research X", "find data on Y", ...]
    plan: str                               # Human readable plan

    # Researcher output (list because multiple researchers run in parallel)
    research_results: Annotated[list, operator.add]  # Each researcher appends here

    # Critic output
    critique: str                           # What's missing or wrong
    approved: bool                          # Did critic approve the research?

    # Writer output
    final_report: str                       # The finished markdown report

    # Metadata (useful for the frontend to show progress)
    current_agent: str                      # Which agent is running right now
    error: str                              # Any error that happened