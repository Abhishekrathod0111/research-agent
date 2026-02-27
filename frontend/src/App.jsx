import { useState } from "react"
import axios from "axios"
import ReactMarkdown from "react-markdown"

const AGENTS = [
  { id: "planner",    label: "Planner",    desc: "Breaking query into research tasks",  icon: "🧠" },
  { id: "researcher", label: "Researcher", desc: "Searching the web for each task",     icon: "🔍" },
  { id: "critic",     label: "Critic",     desc: "Reviewing research quality",          icon: "⚖️" },
  { id: "writer",     label: "Writer",     desc: "Writing the final report",            icon: "✍️" },
]

function AgentStep({ agent, status }) {
  const colors = {
    waiting:  { border: "#2d2d44", bg: "#1a1a2e", text: "#4a4a6a", dot: "#2d2d44" },
    active:   { border: "#4f46e5", bg: "#1e1b4b", text: "#a5b4fc", dot: "#4f46e5" },
    done:     { border: "#059669", bg: "#022c22", text: "#6ee7b7", dot: "#059669" },
  }
  const c = colors[status]

  return (
    <div style={{
      border: `1px solid ${c.border}`,
      background: c.bg,
      borderRadius: "12px",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      transition: "all 0.4s ease",
    }}>
      {/* Animated dot */}
      <div style={{
        width: 10, height: 10,
        borderRadius: "50%",
        background: c.dot,
        boxShadow: status === "active" ? `0 0 10px ${c.dot}` : "none",
        animation: status === "active" ? "pulse 1.5s infinite" : "none",
        flexShrink: 0,
      }} />
      <span style={{ fontSize: "22px" }}>{agent.icon}</span>
      <div>
        <div style={{ fontWeight: 600, color: c.text, fontSize: "15px" }}>
          {agent.label}
          {status === "active" && (
            <span style={{ marginLeft: 8, fontSize: "12px", opacity: 0.7 }}>running...</span>
          )}
          {status === "done" && (
            <span style={{ marginLeft: 8, fontSize: "12px" }}>✓ done</span>
          )}
        </div>
        <div style={{ fontSize: "13px", color: "#64748b", marginTop: 2 }}>{agent.desc}</div>
      </div>
    </div>
  )
}

export default function App() {
  const [query, setQuery]           = useState("")
  const [loading, setLoading]       = useState(false)
  const [activeAgent, setActiveAgent] = useState(null)  // which agent is currently running
  const [doneAgents, setDoneAgents] = useState([])
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState(null)

  // Simulate agent progress while API call runs
  // Real streaming would need SSE — this is a good approximation for now
  const simulateProgress = () => {
    const sequence = [
      { agent: "planner",    delay: 0    },
      { agent: "researcher", delay: 4000 },
      { agent: "critic",     delay: 22000 },
      { agent: "writer",     delay: 28000 },
    ]

    sequence.forEach(({ agent, delay }) => {
      setTimeout(() => {
        setActiveAgent(agent)
        setDoneAgents(prev => {
          const idx = sequence.findIndex(s => s.agent === agent)
          return sequence.slice(0, idx).map(s => s.agent)
        })
      }, delay)
    })
  }

  const runResearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    setDoneAgents([])
    setActiveAgent(null)

    simulateProgress()

    try {
      const res = await axios.post("http://localhost:8000/research/run", { query })
      setResult(res.data)
      setActiveAgent(null)
      setDoneAgents(["planner", "researcher", "critic", "writer"])
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  const agentStatus = (agentId) => {
    if (doneAgents.includes(agentId)) return "done"
    if (activeAgent === agentId) return "active"
    return "waiting"
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13" }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .report-content h1, .report-content h2, .report-content h3 {
          color: #a5b4fc; margin: 24px 0 12px; font-weight: 600;
        }
        .report-content p { color: #cbd5e1; line-height: 1.8; margin-bottom: 14px; }
        .report-content ul, .report-content ol { color: #cbd5e1; padding-left: 24px; margin-bottom: 14px; }
        .report-content li { margin-bottom: 6px; line-height: 1.7; }
        .report-content strong { color: #e2e8f0; }
        .report-content hr { border-color: #2d2d44; margin: 24px 0; }
        .report-content code { background: #1e1b4b; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1e1e2e",
        padding: "20px 40px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#0d0d17"
      }}>
        <span style={{ fontSize: 24 }}>🤖</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#e2e8f0" }}>Research Agent</div>
          <div style={{ fontSize: 12, color: "#4a4a6a" }}>Planner → Researcher → Critic → Writer</div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>

        {/* Search box */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
            What do you want to research?
          </div>
          <div style={{ fontSize: 14, color: "#4a4a6a", marginBottom: 24 }}>
            4 AI agents will collaborate to research, verify, and report.
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && runResearch()}
              placeholder="e.g. What are the most in-demand AI engineer skills in 2026?"
              disabled={loading}
              style={{
                flex: 1,
                background: "#1a1a2e",
                border: "1px solid #2d2d44",
                borderRadius: 10,
                padding: "14px 18px",
                color: "#e2e8f0",
                fontSize: 15,
                outline: "none",
                transition: "border 0.2s",
              }}
            />
            <button
              onClick={runResearch}
              disabled={loading || !query.trim()}
              style={{
                background: loading ? "#2d2d44" : "#4f46e5",
                color: loading ? "#4a4a6a" : "white",
                border: "none",
                borderRadius: 10,
                padding: "14px 28px",
                fontWeight: 600,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Researching..." : "Run Research →"}
            </button>
          </div>
        </div>

        {/* Agent progress — only show when loading or done */}
        {(loading || result) && (
          <div style={{
            marginBottom: 40,
            animation: "fadeIn 0.4s ease",
          }}>
            <div style={{ fontSize: 13, color: "#4a4a6a", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
              Agent Pipeline
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {AGENTS.map(agent => (
                <AgentStep key={agent.id} agent={agent} status={agentStatus(agent.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "#2d0a0a", border: "1px solid #7f1d1d",
            borderRadius: 10, padding: 16, color: "#fca5a5",
            marginBottom: 24, animation: "fadeIn 0.3s ease"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>

            {/* Plan used */}
            <div style={{
              background: "#1a1a2e", border: "1px solid #2d2d44",
              borderRadius: 10, padding: 20, marginBottom: 24
            }}>
              <div style={{ fontSize: 12, color: "#4a4a6a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                Research Plan
              </div>
              <pre style={{ color: "#94a3b8", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                {result.plan}
              </pre>
            </div>

            {/* Critic verdict */}
            <div style={{
              background: result.approved ? "#022c22" : "#1a0a0a",
              border: `1px solid ${result.approved ? "#059669" : "#7f1d1d"}`,
              borderRadius: 10, padding: "12px 20px", marginBottom: 24,
              display: "flex", alignItems: "center", gap: 10
            }}>
              <span>{result.approved ? "✅" : "⚠️"}</span>
              <span style={{ fontSize: 13, color: result.approved ? "#6ee7b7" : "#fca5a5" }}>
                Critic: {result.approved ? "Research approved" : "Research flagged for revision"}
              </span>
            </div>

            {/* Final report */}
            <div style={{
              background: "#13131f", border: "1px solid #2d2d44",
              borderRadius: 12, padding: 32,
            }}>
              <div style={{ fontSize: 12, color: "#4a4a6a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>
                Final Report
              </div>
              <div className="report-content">
                <ReactMarkdown>{result.final_report}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}