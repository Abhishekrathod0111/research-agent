from langchain_groq import ChatGroq
from app.core.config import GROQ_API_KEY, GROQ_MODEL
from app.graph.state import ResearchState
from app.graph.tools import web_search, format_search_results

# One LLM instance shared across all agents
llm = ChatGroq(api_key=GROQ_API_KEY, model=GROQ_MODEL, temperature=0.3, max_retries=1)


# ============================================================
# AGENT 1: PLANNER
# Job: Break the user query into 3 specific research sub-tasks
# ============================================================
def planner_node(state: ResearchState) -> dict:
    print(f"[PLANNER] Planning research for: {state['query']}")
    
    response = llm.invoke([
        {
            "role": "system",
            "content": (
                "You are a research planner. Break the user's query into exactly 2 "
                "specific, searchable sub-tasks. Return ONLY a numbered list. No intro text."
            )
        },
        {
            "role": "user",
            "content": f"Query: {state['query']}\n\nCreate 2 research sub-tasks:"
        }
    ])
    
    # Parse the numbered list into a Python list
    lines = response.content.strip().split("\n")
    sub_tasks = [
        line.split(". ", 1)[-1].strip()
        for line in lines
        if line.strip() and line[0].isdigit()
    ][:2]  # Max 3 tasks
    
    plan_text = "\n".join(f"{i+1}. {t}" for i, t in enumerate(sub_tasks))
    
    return {
        "sub_tasks": sub_tasks,
        "plan": plan_text,
        "current_agent": "planner_done"
    }


# ============================================================
# AGENT 2: RESEARCHER
# Job: Take ONE sub-task, search the web, return findings
# This runs once per sub-task (we'll handle parallelism in graph.py)
# ============================================================
def researcher_node(state: ResearchState) -> dict:
    # Get next unresearched task
    # We track progress by comparing task count to results count
    task_index = len(state.get("research_results", []))
    
    if task_index >= len(state["sub_tasks"]):
        return {"research_results": [], "current_agent": "researcher_done"}
    
    task = state["sub_tasks"][task_index]
    print(f"[RESEARCHER] Researching: {task}")
    
    # Step 1: Search the web
    raw_results = web_search(task, max_results=2)
    formatted = format_search_results(raw_results)
    
    # Step 2: Ask LLM to synthesize the search results
    response = llm.invoke([
        {
            "role": "system",
            "content": (
                "You are a research analyst. Synthesize the web search results "
                "into a clear, factual summary. Be specific, cite key points. "
                "2-3 paragraphs max."
            )
        },
        {
            "role": "user",
            "content": (
                f"Research task: {task}\n\n"
                f"Search results:\n{formatted}\n\n"
                f"Write a research summary:"
            )
        }
    ])
    
    result = {
        "task": task,
        "summary": response.content,
        "sources": [r.get("url", "") for r in raw_results]
    }
    
    return {
        "research_results": [result],  # Gets merged with other researchers via operator.add
        "current_agent": f"researcher_{task_index}_done"
    }


# ============================================================
# AGENT 3: CRITIC
# Job: Review all research, identify gaps, decide if it's good enough
# ============================================================
def critic_node(state: ResearchState) -> dict:
    print("[CRITIC] Reviewing research quality...")
    
    # Compile all research into one text block
    all_research = "\n\n".join([
        f"Task: {r['task']}\nSummary: {r['summary']}"
        for r in state.get("research_results", [])
    ])
    
    response = llm.invoke([
        {
            "role": "system",
            "content": (
                "You are a critical research reviewer. Evaluate the research quality. "
                "Identify gaps, contradictions, or missing angles. "
                "End your response with either APPROVED or NEEDS_REVISION."
            )
        },
        {
            "role": "user",
            "content": (
                f"Original query: {state['query']}\n\n"
                f"Research collected:\n{all_research}\n\n"
                f"Review this research:"
            )
        }
    ])
    
    critique_text = response.content
    approved = "APPROVED" in critique_text.upper()
    
    return {
        "critique": critique_text,
        "approved": approved,
        "current_agent": "critic_done"
    }


# ============================================================
# AGENT 4: WRITER
# Job: Turn all research into a clean final report
# ============================================================
def writer_node(state: ResearchState) -> dict:
    print("[WRITER] Writing final report...")
    
    all_research = "\n\n".join([
        f"### {r['task']}\n{r['summary']}"
        for r in state.get("research_results", [])
    ])
    
    all_sources = []
    for r in state.get("research_results", []):
        all_sources.extend(r.get("sources", []))
    sources_text = "\n".join(f"- {s}" for s in all_sources if s)
    
    response = llm.invoke([
        {
            "role": "system",
            "content": (
                "You are an expert report writer. Write a comprehensive, well-structured "
                "research report in Markdown format. Include: Executive Summary, "
                "Key Findings sections, and a Conclusion. Be insightful and specific."
            )
        },
        {
            "role": "user",
            "content": (
                f"Query: {state['query']}\n\n"
                f"Research:\n{all_research}\n\n"
                f"Critic notes: {state.get('critique', 'None')}\n\n"
                f"Write the final report:"
            )
        }
    ])
    
    final = response.content + f"\n\n---\n**Sources:**\n{sources_text}"
    
    return {
        "final_report": final,
        "current_agent": "writer_done"
    }