from tavily import TavilyClient
from app.core.config import TAVILY_API_KEY

tavily = TavilyClient(api_key=TAVILY_API_KEY)


def web_search(query: str, max_results: int = 5) -> list[dict]:
    """
    Search the web using Tavily.
    Returns list of {title, url, content} dicts.
    
    This is the tool our Research agents will call.
    """
    try:
        response = tavily.search(
            query=query,
            max_results=max_results,
            search_depth="advanced"  # deeper search, still free tier
        )
        return response.get("results", [])
    except Exception as e:
        return [{"title": "Error", "url": "", "content": str(e)}]


def format_search_results(results: list[dict]) -> str:
    """
    Turns raw Tavily results into clean text an LLM can read.
    """
    if not results:
        return "No results found."
    
    formatted = []
    for i, r in enumerate(results, 1):
        formatted.append(
            f"[Source {i}] {r.get('title', 'No title')}\n"
            f"URL: {r.get('url', '')}\n"
            f"Content: {r.get('content', '')[:500]}\n"  # truncate to 500 chars per source
        )
    return "\n---\n".join(formatted)