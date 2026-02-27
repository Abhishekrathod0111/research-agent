from langgraph.graph import StateGraph, END
from app.graph.state import ResearchState
from app.graph.nodes import planner_node, researcher_node, critic_node, writer_node


def should_continue_research(state: ResearchState) -> str:
    """
    Router function: after each researcher runs, check if all tasks are done.
    This is how LangGraph does conditional routing between nodes.
    """
    results_count = len(state.get("research_results", []))
    tasks_count = len(state.get("sub_tasks", []))
    
    if results_count < tasks_count:
        return "researcher"  # Run researcher again for next task
    return "critic"          # All tasks done, go to critic


def build_graph():
    """
    Builds and compiles the research agent graph.
    Think of this as drawing the flowchart in code.
    """
    graph = StateGraph(ResearchState)

    # Add all nodes (agents)
    graph.add_node("planner", planner_node)
    graph.add_node("researcher", researcher_node)
    graph.add_node("critic", critic_node)
    graph.add_node("writer", writer_node)

    # Define the flow
    graph.set_entry_point("planner")                    # Always start with planner

    graph.add_edge("planner", "researcher")             # Planner → first researcher run

    graph.add_conditional_edges(                        # After each researcher:
        "researcher",
        should_continue_research,                       # Check if more tasks remain
        {
            "researcher": "researcher",                 # Loop back if more tasks
            "critic": "critic"                          # Move on when all done
        }
    )

    graph.add_edge("critic", "writer")                  # Critic → Writer (always)
    graph.add_edge("writer", END)                       # Writer → Done

    return graph.compile()


# Build once at import time
research_graph = build_graph()