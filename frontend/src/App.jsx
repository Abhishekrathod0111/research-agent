import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const API = "https://research-agent-ymek.onrender.com";

const agents = [
  { id: "planner", label: "Planner", desc: "Breaking down the query" },
  { id: "researcher", label: "Researcher", desc: "Searching the web" },
  { id: "critic", label: "Critic", desc: "Verifying findings" },
  { id: "writer", label: "Writer", desc: "Generating report" },
];

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);
  const [doneAgents, setDoneAgents] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/research/history`);
      setHistory(res.data.history);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const simulateProgress = () => {
    const sequence = [
      { agent: "planner", delay: 0 },
      { agent: "researcher", delay: 4000 },
      { agent: "critic", delay: 22000 },
      { agent: "writer", delay: 28000 },
    ];
    sequence.forEach(({ agent, delay }) => {
      setTimeout(() => {
        setActiveAgent(agent);
        setDoneAgents((prev) => {
          const idx = agents.findIndex((a) => a.id === agent);
          return agents.slice(0, idx).map((a) => a.id);
        });
      }, delay);
    });
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setDoneAgents([]);
    setActiveAgent(null);
    simulateProgress();
    try {
      const res = await axios.post(`${API}/research/run`, { query });
      setResult(res.data);
      setDoneAgents(agents.map((a) => a.id));
      setActiveAgent(null);
      fetchHistory();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item) => {
    setResult({
      plan: item.plan,
      final_report: item.final_report,
      approved: item.approved,
      critique: item.critique,
    });
    setQuery(item.query);
    setDoneAgents(agents.map((a) => a.id));
    setShowHistory(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f0f", color: "#e0e0e0", fontFamily: "sans-serif" }}>
      
      {/* Sidebar */}
      {showHistory && (
        <div style={{ width: "300px", background: "#1a1a1a", borderRight: "1px solid #333", padding: "20px", overflowY: "auto" }}>
          <h3 style={{ color: "#a78bfa", marginTop: 0 }}>Research History</h3>
          {history.length === 0 && <p style={{ color: "#666" }}>No history yet</p>}
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => loadFromHistory(item)}
              style={{ padding: "12px", marginBottom: "8px", background: "#252525", borderRadius: "8px", cursor: "pointer", borderLeft: "3px solid #a78bfa" }}
            >
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "#e0e0e0" }}>
                {item.query.length > 50 ? item.query.slice(0, 50) + "..." : item.query}
              </div>
              <div style={{ fontSize: "11px", color: "#666" }}>
                {new Date(item.created_at).toLocaleString()}
              </div>
              <div style={{ fontSize: "11px", marginTop: "4px", color: item.approved ? "#4ade80" : "#f87171" }}>
                {item.approved ? "✓ Approved" : "⚠ Flagged"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", color: "#a78bfa" }}>Research Agent</h1>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: "14px" }}>Multi-agent AI powered by LangGraph</p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{ background: "#252525", border: "1px solid #333", color: "#a78bfa", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
          >
            {showHistory ? "Hide History" : "History"} {history.length > 0 && `(${history.length})`}
          </button>
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
            placeholder="What do you want to research?"
            style={{ flex: 1, padding: "14px 18px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "#e0e0e0", fontSize: "15px", outline: "none" }}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: "14px 28px", background: loading ? "#333" : "#a78bfa", color: "#0f0f0f", border: "none", borderRadius: "10px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: "15px" }}
          >
            {loading ? "Researching..." : "Research"}
          </button>
        </div>

        {/* Agent Pipeline */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "32px" }}>
          {agents.map((agent) => {
            const isActive = activeAgent === agent.id;
            const isDone = doneAgents.includes(agent.id);
            return (
              <div key={agent.id} style={{ padding: "16px", background: "#1a1a1a", borderRadius: "10px", border: `1px solid ${isActive ? "#a78bfa" : isDone ? "#4ade80" : "#333"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  {isActive && <span style={{ width: "8px", height: "8px", background: "#a78bfa", borderRadius: "50%", display: "inline-block", animation: "pulse 1s infinite" }} />}
                  {isDone && <span style={{ color: "#4ade80" }}>✓</span>}
                  {!isActive && !isDone && <span style={{ width: "8px", height: "8px", background: "#333", borderRadius: "50%", display: "inline-block" }} />}
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>{agent.label}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#666" }}>{agent.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Results */}
        {result && (
          <div>
            {result.plan && (
              <div style={{ background: "#1a1a1a", borderRadius: "10px", padding: "20px", marginBottom: "16px", border: "1px solid #333" }}>
                <h3 style={{ margin: "0 0 12px", color: "#a78bfa", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>Research Plan</h3>
                <p style={{ margin: 0, color: "#ccc", fontSize: "14px", lineHeight: 1.6 }}>{result.plan}</p>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, background: result.approved ? "#14532d" : "#450a0a", color: result.approved ? "#4ade80" : "#f87171" }}>
                {result.approved ? "✓ Critic Approved" : "⚠ Critic Flagged"}
              </span>
              {result.critique && <span style={{ fontSize: "12px", color: "#666" }}>{result.critique.slice(0, 80)}...</span>}
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: "10px", padding: "28px", border: "1px solid #333", lineHeight: 1.8 }}>
              <ReactMarkdown>{result.final_report}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}