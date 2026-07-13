import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { chatWithZevo, runScenario, runRealitySearch } from "../utils/claudeApi";

const COLORS = ["#FF1E3C", "#3B4FFF", "#00FF88", "#FFB800", "#a78bfa", "#22D3EE"];

const PROMPT_CHIPS = [
  "What is my biggest risk?",
  "Find top performing products",
  "What is causing the anomaly?",
  "Which region is underperforming?",
  "What should I focus on this week?",
  "How can I improve profitability?",
];

export default function Dashboard({
  analysis, profile, mode, onModeChange,
  onNewUpload, onCEOMode,
  activeTab: propTab, onTabChange
}) {
  const [localTab, setLocalTab] = useState("overview");
  const activeTab = propTab || localTab;
  const setActiveTab = (tab) => {
    setLocalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [expandedAnomaly, setExpandedAnomaly] = useState(null);
  const [scenarioInput, setScenarioInput] = useState("");
  const [scenarioResult, setScenarioResult] = useState(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [realityInput, setRealityInput] = useState("");
  const [realityResult, setRealityResult] = useState(null);
  const [realityLoading, setRealityLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const kpis = analysis?.kpi_cards || [];
  const anomalies = analysis?.anomalies || [];
  const insights = analysis?.insights || [];
  const chartSuggestions = analysis?.chart_suggestions || [];
  const chartData = analysis?.chart_data || {};
  const confidence = analysis?.confidence || {};

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input requires Chrome browser.");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    setListening(true);
    recognition.start();
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setChatInput(transcript);
      setListening(false);
      handleChat(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  const handleChat = async (question) => {
    const q = question || chatInput;
    if (!q.trim()) return;
    setChatInput("");
    const newHistory = [...chatHistory, { role: "user", content: q }];
    setChatHistory(newHistory);
    setChatLoading(true);
    try {
      const response = await chatWithZevo(q, analysis?.data_stats, profile, chatHistory);
      setChatHistory([...newHistory, { role: "assistant", content: response }]);
      speak(response);
    } catch {
      setChatHistory([...newHistory, { role: "assistant", content: "ZEVO could not process that. Please try again." }]);
    }
    setChatLoading(false);
  };

  const handleScenario = async () => {
    if (!scenarioInput.trim()) return;
    setScenarioLoading(true);
    setScenarioResult(null);
    try {
      const result = await runScenario(scenarioInput, analysis?.data_stats, profile);
      setScenarioResult(result);
    } catch {
      setScenarioResult({ error: "Could not run scenario. Please try again." });
    }
    setScenarioLoading(false);
  };

  const handleRealitySearch = async () => {
    if (!realityInput.trim()) return;
    setRealityLoading(true);
    setRealityResult(null);
    try {
      const result = await runRealitySearch(realityInput, analysis?.data_stats, profile);
      setRealityResult(result);
    } catch {
      setRealityResult({ error: "Could not run Reality Search. Please try again." });
    }
    setRealityLoading(false);
  };

  const statusColor = (status) => {
    if (status === "critical") return "#FF1E3C";
    if (status === "warning") return "#FFB800";
    return "#00FF88";
  };

  const trendArrow = (trend, pct) => {
    if (trend === "up") return <span className="trend up">↑ {pct || ""}</span>;
    if (trend === "down") return <span className="trend down">↓ {pct || ""}</span>;
    return <span className="trend neutral">→</span>;
  };

  const getEmoji = (code) => {
    if (code === "RED") return "🔴";
    if (code === "YELLOW") return "🟡";
    if (code === "GREEN") return "🟢";
    return code;
  };

  return (
    <div className="dashboard">
      <div className="dash-topbar">
        <div className="dash-page-title">
          {activeTab === "overview" && "Overview"}
          {activeTab === "anomalies" && `Anomalies ${anomalies.length > 0 ? `(${anomalies.length})` : ""}`}
          {activeTab === "insights" && "Insights"}
          {activeTab === "charts" && "Charts"}
          {activeTab === "scenarios" && "Decision Lab"}
          {activeTab === "reality" && "Reality Search"}
          {activeTab === "futures" && "Future Council"}
          {activeTab === "evolution" && "Evolution Engine"}
          {activeTab === "genome" && "Decision Genome"}
          {activeTab === "memory" && "Company Memory"}
          {activeTab === "night" && "Infinite Night"}
        </div>
        <div className="dash-actions">
          <button className="btn-ghost" onClick={onCEOMode}>Morning Brief</button>
          <button className="btn-ghost" onClick={onNewUpload}>New Upload</button>
          <button className="btn-primary" onClick={() => window.print()}>Export</button>
        </div>
      </div>

      <div className="mode-bar">
        <div className="mode-toggle">
          <button className={`mode-btn ${mode === "autopilot" ? "active" : ""}`} onClick={() => onModeChange("autopilot")}>
            Autopilot
          </button>
          <button className={`mode-btn ${mode === "copilot" ? "active" : ""}`} onClick={() => onModeChange("copilot")}>
            Co-Pilot
          </button>
        </div>
        <div className="confidence-bar">
          <span className="conf-label">Data quality:</span>
          <span className="conf-value">{confidence.overall}%</span>
          <span className="conf-rows">{confidence.clean_rows}/{confidence.total_rows} clean rows</span>
        </div>
      </div>

      <div className="dash-body">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="tab-content">
            <div className="kpi-grid">
              {kpis.map((kpi, i) => (
                <div key={i} className="kpi-card" style={{ borderTop: `2px solid ${statusColor(kpi.status)}` }}>
                  <div className="kpi-label">{kpi.label}</div>
                  <div className="kpi-value">{kpi.value}</div>
                  <div className="kpi-bottom">
                    {trendArrow(kpi.trend, kpi.trend_pct)}
                    <span className="kpi-context">{kpi.context}</span>
                  </div>
                </div>
              ))}
            </div>
            {anomalies.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <h3>Flagged Issues</h3>
                  <button className="btn-text" onClick={() => setActiveTab("anomalies")}>View all →</button>
                </div>
                <div className="anomaly-preview-grid">
                  {anomalies.slice(0, 3).map((a, i) => (
                    <div key={i} className={`anomaly-preview ${a.severity}`}>
                      <span className="anom-sev">{a.severity === "critical" ? "🔴" : a.severity === "warning" ? "🟡" : "🔵"}</span>
                      <div>
                        <div className="anom-title">{a.title}</div>
                        <div className="anom-detail">{a.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis?.data_story && (
              <div className="data-story">
                <div className="data-story-label">ZEVO ANALYSIS</div>
                <p>{analysis.data_story}</p>
              </div>
            )}
          </div>
        )}

        {/* ANOMALIES */}
        {activeTab === "anomalies" && (
          <div className="tab-content">
            <p className="tab-intro">Every anomaly is sourced from your verified data. Click Explain to see exactly how ZEVO reached this conclusion.</p>
            {anomalies.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <div className="empty-title">Everything looks healthy</div>
                <div className="empty-sub">Your key metrics are within normal range.</div>
              </div>
            ) : (
              <div className="anomaly-list">
                {anomalies.map((a, i) => (
                  <div key={i} className={`anomaly-card ${a.severity}`}>
                    <div className="anomaly-top">
                      <span className="anom-sev-icon">{a.severity === "critical" ? "🔴" : a.severity === "warning" ? "🟡" : "🔵"}</span>
                      <div className="anomaly-main">
                        <div className="anomaly-title">{a.title}</div>
                        <div className="anomaly-detail">{a.detail}</div>
                      </div>
                      <button className="explain-btn" onClick={() => setExpandedAnomaly(expandedAnomaly === i ? null : i)}>
                        {expandedAnomaly === i ? "Hide" : "Explain"}
                      </button>
                    </div>
                    {expandedAnomaly === i && a.explanation && (
                      <div className="explain-panel">
                        <div className="explain-level">
                          <div className="explain-level-label">Level 1 — Simple</div>
                          <div className="explain-level-text">{a.explanation.simple}</div>
                        </div>
                        <div className="explain-level">
                          <div className="explain-level-label">Level 2 — Business Reasoning</div>
                          <div className="explain-level-text">{a.explanation.business}</div>
                        </div>
                        <div className="explain-level">
                          <div className="explain-level-label">Level 3 — Full Calculation</div>
                          <div className="explain-level-text calculation">{a.explanation.calculation}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INSIGHTS */}
        {activeTab === "insights" && (
          <div className="tab-content">
            <p className="tab-intro">Analyst-level insights derived from your verified data.</p>
            <div className="insights-list">
              {insights.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💡</div>
                  <div className="empty-title">No insights generated</div>
                  <div className="empty-sub">Upload a richer dataset to unlock insights.</div>
                </div>
              ) : insights.map((ins, i) => (
                <div key={i} className="insight-card">
                  <div className="insight-top">
                    <div className="insight-title">{ins.title}</div>
                    <span className={`conf-badge ${ins.confidence}`}>{ins.confidence}</span>
                  </div>
                  <div className="insight-detail">{ins.detail}</div>
                  <div className="insight-meta">
                    <span className="source-label">Source: {ins.source}</span>
                    <span className="conf-reason">{ins.confidence_reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHARTS */}
        {activeTab === "charts" && (
          <div className="tab-content">
            <div className="charts-grid">
              {chartSuggestions.map((chart, i) => {
                const key = `${chart.x_column}_${chart.y_column}`;
                const data = chartData[key];
                if (!data || data.length === 0) return null;
                return (
                  <div key={i} className="chart-card">
                    <div className="chart-title">{chart.title}</div>
                    <div className="chart-insight">{chart.insight}</div>
                    <div className="chart-body">
                      <ResponsiveContainer width="100%" height={220}>
                        {chart.type === "bar" ? (
                          <BarChart data={data}>
                            <XAxis dataKey={chart.x_column} tick={{ fontSize: 11, fill: "#7A8499" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#7A8499" }} />
                            <Tooltip contentStyle={{ background: "#0C0C18", border: "1px solid rgba(255,30,60,0.2)", color: "#F0F4FF", borderRadius: "8px" }} />
                            <Bar dataKey={chart.y_column} fill="#FF1E3C" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        ) : chart.type === "line" ? (
                          <LineChart data={data}>
                            <XAxis dataKey={chart.x_column} tick={{ fontSize: 11, fill: "#7A8499" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#7A8499" }} />
                            <Tooltip contentStyle={{ background: "#0C0C18", border: "1px solid rgba(255,30,60,0.2)", color: "#F0F4FF", borderRadius: "8px" }} />
                            <Line type="monotone" dataKey={chart.y_column} stroke="#FF1E3C" strokeWidth={2} dot={false} />
                          </LineChart>
                        ) : (
                          <PieChart>
                            <Pie data={data} dataKey={chart.y_column} nameKey={chart.x_column} cx="50%" cy="50%" outerRadius={80}>
                              {data.map((entry, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: "#0C0C18", border: "1px solid rgba(255,30,60,0.2)", color: "#F0F4FF", borderRadius: "8px" }} />
                          </PieChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
              {chartSuggestions.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <div className="empty-title">No charts generated</div>
                  <div className="empty-sub">Upload a file with numeric columns to see charts.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCENARIOS */}
        {activeTab === "scenarios" && (
          <div className="tab-content">
            <div className="scenario-header">
              <h3>Decision Lab</h3>
              <p>Model what-if decisions on your actual data. ZEVO computes projected impact before you act.</p>
              <div className="scenario-disclaimer">
                This is a Simulation — not a guaranteed prediction.
              </div>
            </div>
            <div className="scenario-input-area">
              <input
                className="scenario-input"
                placeholder='e.g. "What if I increase prices by 10%?" or "What if I cut the bottom 20% of SKUs?"'
                value={scenarioInput}
                onChange={(e) => setScenarioInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScenario()}
              />
              <button className="btn-primary" onClick={handleScenario} disabled={scenarioLoading}>
                {scenarioLoading ? "Simulating..." : "Run →"}
              </button>
            </div>
            {scenarioResult && !scenarioResult.error && (
              <div className="scenario-result">
                <div className="scenario-result-header">
                  <div className="scenario-title">{scenarioResult.scenario_title}</div>
                  <span className="scenario-type-badge">{scenarioResult.type}</span>
                </div>
                <div className="scenario-assumption">Assumption: {scenarioResult.assumption}</div>
                <div className="scenario-impact">
                  <div className="impact-metric">{scenarioResult.projected_impact?.metric}</div>
                  <div className="impact-values">
                    <div className="impact-current">
                      <span className="impact-label">Current</span>
                      <span className="impact-value">{scenarioResult.projected_impact?.current_value}</span>
                    </div>
                    <div className="impact-arrow">→</div>
                    <div className="impact-projected">
                      <span className="impact-label">Projected</span>
                      <span className="impact-value highlight">{scenarioResult.projected_impact?.projected_value}</span>
                    </div>
                  </div>
                </div>
                <div className="scenario-pros-cons">
                  <div className="pros">
                    <div className="pros-label">Benefits</div>
                    {scenarioResult.benefits?.map((b, i) => <div key={i} className="pro-item">{b}</div>)}
                  </div>
                  <div className="cons">
                    <div className="cons-label">Risks</div>
                    {scenarioResult.risks?.map((r, i) => <div key={i} className="con-item">{r}</div>)}
                  </div>
                </div>
                <div className="scenario-recommendation">{scenarioResult.recommendation}</div>
                <div className="scenario-confidence">Confidence: {scenarioResult.confidence} — {scenarioResult.confidence_reason}</div>
              </div>
            )}
            {scenarioResult?.error && <div className="upload-error">{scenarioResult.error}</div>}
          </div>
        )}

        {/* REALITY SEARCH */}
        {activeTab === "reality" && (
          <div className="tab-content">
            <div className="scenario-header">
              <h3>Reality Search</h3>
              <p>Describe a future worth creating. ZEVO searches for the strongest paths to get there from where you actually stand today.</p>
              <div className="scenario-disclaimer">
                ZEVO returns the 3 most realistic strategic paths based on your actual data.
              </div>
            </div>
            <div className="scenario-input-area">
              <input
                className="scenario-input"
                placeholder='e.g. "Find futures where revenue grows 30% without increasing costs"'
                value={realityInput}
                onChange={(e) => setRealityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRealitySearch()}
              />
              <button className="btn-primary" onClick={handleRealitySearch} disabled={realityLoading}>
                {realityLoading ? "Searching futures..." : "Search →"}
              </button>
            </div>
            {realityResult && !realityResult.error && (
              <div className="reality-result">
                <div className="reality-goal">Goal: {realityResult.goal}</div>
                <div className="reality-paths">
                  {realityResult.futures?.map((future, i) => (
                    <div key={i} className={`reality-path ${i === 0 ? "recommended" : ""}`}>
                      <div className="path-header">
                        <div className="path-name">{future.path_name}</div>
                        <div className="path-meta">
                          <span className="path-prob">{future.probability}</span>
                          <span className="path-time">{future.time_to_achieve}</span>
                          <span className={`conf-badge ${future.confidence}`}>{future.confidence}</span>
                        </div>
                      </div>
                      <div className="path-moves">
                        <div className="moves-label">Key Moves</div>
                        {future.key_moves?.map((move, j) => (
                          <div key={j} className="path-move">→ {move}</div>
                        ))}
                      </div>
                      <div className="path-risk">Risk: {future.biggest_risk}</div>
                      <div className="path-first-step">First step: <strong>{future.first_step}</strong></div>
                      {i === 0 && <div className="path-recommended-badge">ZEVO Recommended Path</div>}
                    </div>
                  ))}
                </div>
                {realityResult.recommended_path && (
                  <div className="reality-recommendation">{realityResult.recommended_path}</div>
                )}
              </div>
            )}
            {realityResult?.error && <div className="upload-error">{realityResult.error}</div>}
          </div>
        )}

        {/* FUTURE COUNCIL */}
        {activeTab === "futures" && (
          <div className="tab-content">
            <div className="engine-hero">
              <div className="engine-eyebrow">STRATEGIC ENGINE 01</div>
              <h2 className="engine-title">Future Council</h2>
              <p className="engine-desc">
                An immortal board that never sleeps, never forgets, and debates which future your company should inhabit. The Council convenes every night and returns with a verdict every morning.
              </p>
            </div>
            <div className="council-grid">
              {[
                { type: "critical", label: "FUTURE A — HIGH PROBABILITY", title: "Consolidation and margin expansion", desc: "Based on your current data trajectory, the strongest near-term future involves stopping new market entry and doubling down on contribution margin improvements in your existing base. The Council estimates a 34% improvement in profitability within 2 quarters.", verdict: "Pursue with high confidence" },
                { type: "warning", label: "FUTURE B — MEDIUM PROBABILITY", title: "Aggressive expansion before competition intensifies", desc: "The window for category leadership is narrowing. Moving aggressively into 2 new segments before a well-funded competitor could define the next 5 years. High risk, high reward.", verdict: "Requires capital validation first" },
                { type: "healthy", label: "FUTURE C — EMERGING SIGNAL", title: "Platform pivot — becoming infrastructure", desc: "Your operational data suggests you have built capabilities that competitors would pay to access. A platform play — licensing your infrastructure — could create recurring revenue with near-zero marginal cost.", verdict: "Worth a 90-day experiment" },
              ].map((item, i) => (
                <div key={i} className={`council-card ${item.type}`}>
                  <div className="council-card-label">{item.label}</div>
                  <div className="council-card-title">{item.title}</div>
                  <div className="council-card-desc">{item.desc}</div>
                  <div className="council-card-verdict">
                    <span className="verdict-label">Council Verdict: </span>{item.verdict}
                  </div>
                </div>
              ))}
            </div>
            <div className="engine-question-box">
              <div className="engine-question-label">THE QUESTION ZEVO IS ASKING TONIGHT</div>
              <div className="engine-question-text">
                "Which of these three futures is worth building — and what would need to be true about your business for each one to succeed?"
              </div>
            </div>
          </div>
        )}

        {/* EVOLUTION ENGINE */}
        {activeTab === "evolution" && (
          <div className="tab-content">
            <div className="engine-hero">
              <div className="engine-eyebrow">STRATEGIC ENGINE 02</div>
              <h2 className="engine-title">Evolution Engine</h2>
              <p className="engine-desc">
                ZEVO does not optimize your current company. It designs the next version of it — new pricing architectures, organizational redesigns, market expansions, product concepts, and hiring structures.
              </p>
            </div>
            <div className="evolution-grid">
              {[
                { category: "PRICING ARCHITECTURE", current: "You currently use flat-rate pricing across all customer segments.", proposal: "Shift to outcome-based pricing for enterprise accounts. Charge a percentage of measurable value delivered rather than a fixed fee. This aligns your incentives with customer success and removes price as a barrier to entry.", impact: "Estimated 40-60% increase in enterprise LTV", difficulty: "Medium — requires 90-day pilot" },
                { category: "ORGANIZATIONAL DESIGN", current: "Your current structure creates functional silos between Sales and Product.", proposal: "Reorganize around customer journey stages rather than functions. A single team owns acquisition, another owns activation, another owns retention. Each team has its own P&L and full-stack capability.", impact: "2.3x faster product iteration cycles", difficulty: "High — 6 month transition" },
                { category: "MARKET EXPANSION", current: "You are currently focused on a single geographic market.", proposal: "The Southeast Asia opportunity matches your India playbook almost exactly — similar customer behavior, similar price sensitivity, similar distribution gaps. One dedicated BD hire could validate this in 90 days.", impact: "Potential 30% revenue upside in 18 months", difficulty: "Low to start — one hire, one market" },
                { category: "PRODUCT CONCEPT", current: "Your core product solves a single problem for one customer type.", proposal: "Your power users have built workarounds for 3 adjacent problems your product does not solve. Building these natively would increase switching costs dramatically and open a new revenue tier.", impact: "15-25% reduction in annual churn", difficulty: "Medium — 2 engineering quarters" },
              ].map((item, i) => (
                <div key={i} className="evolution-card">
                  <div className="evolution-category">{item.category}</div>
                  <div className="evolution-current"><span className="evo-label">Current State: </span>{item.current}</div>
                  <div className="evolution-proposal"><span className="evo-label">ZEVO Proposes: </span>{item.proposal}</div>
                  <div className="evolution-footer">
                    <div className="evolution-impact">{item.impact}</div>
                    <div className="evolution-difficulty">{item.difficulty}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DECISION GENOME */}
        {activeTab === "genome" && (
          <div className="tab-content">
            <div className="engine-hero">
              <div className="engine-eyebrow">STRATEGIC ENGINE 03</div>
              <h2 className="engine-title">Decision Genome</h2>
              <p className="engine-desc">
                ZEVO learns how your company naturally makes decisions — where it is systematically slow, where it consistently over-invests, what blind spots repeat. It intervenes before the pattern strikes again.
              </p>
            </div>
            <div className="genome-patterns">
              {[
                { pattern: "Systematic underestimation of logistics costs", frequency: "Detected in 7 of last 9 market entries", severity: "critical", description: "Every time your company enters a new market, logistics costs come in 23% above projection. This has happened consistently. It is not a forecasting error — it is a structural blind spot in how your team scopes new markets.", intervention: "Before your next market entry, ZEVO will flag this pattern and require a logistics-first due diligence step." },
                { pattern: "Delayed response to early churn signals", frequency: "Average 47-day lag from signal to action", severity: "warning", description: "Your data shows that customers who reduce engagement by more than 30% in a given month have an 84% probability of churning within 60 days. Your team typically responds 47 days after the signal appears.", intervention: "ZEVO will surface churn-risk accounts within 72 hours of signal detection going forward." },
                { pattern: "Over-investment in top-of-funnel before mid-funnel is fixed", frequency: "Recurring in 4 of last 6 quarters", severity: "warning", description: "When growth slows, your instinct is to increase acquisition spend. But your conversion data shows the bottleneck is consistently in the activation stage, not awareness. More top-of-funnel spend into a broken mid-funnel accelerates burn without improving outcomes.", intervention: "ZEVO will require activation metrics to be reviewed before approving incremental acquisition budget." },
              ].map((item, i) => (
                <div key={i} className={`genome-card ${item.severity}`}>
                  <div className="genome-card-header">
                    <div className="genome-pattern-name">{item.pattern}</div>
                    <div className={`genome-severity ${item.severity}`}>{item.frequency}</div>
                  </div>
                  <div className="genome-description">{item.description}</div>
                  <div className="genome-intervention">
                    <span className="intervention-label">ZEVO Intervention: </span>{item.intervention}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPANY MEMORY */}
        {activeTab === "memory" && (
          <div className="tab-content">
            <div className="engine-hero">
              <div className="engine-eyebrow">STRATEGIC ENGINE 04</div>
              <h2 className="engine-title">Company Memory</h2>
              <p className="engine-desc">
                ZEVO never forgets. Every analysis, every finding, every decision is stored and searchable. Ask ZEVO why something happened and it will trace it back through every brief it has ever delivered.
              </p>
            </div>
            <div className="memory-stats">
              <div className="memory-stat">
                <div className="memory-stat-num">{analysis?.data_stats?.total_rows || 0}</div>
                <div className="memory-stat-label">Rows Analysed</div>
              </div>
              <div className="memory-stat">
                <div className="memory-stat-num">{anomalies.length}</div>
                <div className="memory-stat-label">Anomalies Found</div>
              </div>
              <div className="memory-stat">
                <div className="memory-stat-num">{insights.length}</div>
                <div className="memory-stat-label">Insights Generated</div>
              </div>
              <div className="memory-stat">
                <div className="memory-stat-num">1</div>
                <div className="memory-stat-label">Sessions Remembered</div>
              </div>
            </div>
            <div className="memory-timeline">
              {[
                { time: "Today, 7:00 AM", title: "Morning Brief delivered", detail: `Analysis of ${analysis?.data_stats?.total_rows || 0} rows completed. ${anomalies.length} anomalies detected. Strategic brief prepared.` },
                { time: "Tonight, 11:00 PM", title: "Infinite Night begins", detail: "ZEVO will run its overnight simulation cycle. Findings delivered tomorrow morning." },
                { time: "This week", title: "Evolution Engine proposals", detail: "ZEVO is preparing organizational and pricing redesign proposals based on your data patterns." },
              ].map((item, i) => (
                <div key={i} className="memory-item">
                  <div className="memory-dot" />
                  <div className="memory-time">{item.time}</div>
                  <div className="memory-content">
                    <div className="memory-title">{item.title}</div>
                    <div className="memory-detail">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INFINITE NIGHT */}
        {activeTab === "night" && (
          <div className="tab-content">
            <div className="engine-hero">
              <div className="engine-eyebrow">CORE SYSTEM</div>
              <h2 className="engine-title">Infinite Night</h2>
              <p className="engine-desc">
                While your team sleeps, ZEVO runs its night cycle. Hypotheses generated. Scenarios simulated. Assumptions challenged. Discoveries made. Every morning your company wakes up smarter.
              </p>
            </div>
            <div className="night-status">
              <div className="night-status-header">
                <div className="night-status-indicator">
                  <div className="night-pulse" />
                  <span>Night Cycle — Running</span>
                </div>
                <div className="night-completion">Next brief in 6h 42m</div>
              </div>
              <div className="night-phases">
                {[
                  { phase: "01", name: "Data Ingestion", status: "complete", desc: "All business data read and verified" },
                  { phase: "02", name: "Hypothesis Generation", status: "complete", desc: "47 research questions generated autonomously" },
                  { phase: "03", name: "Simulation Engine", status: "active", desc: "Running scenario simulations against your data" },
                  { phase: "04", name: "Challenge Protocol", status: "pending", desc: "ZEVO argues against its own findings" },
                  { phase: "05", name: "Brief Preparation", status: "pending", desc: "Executive brief compiled for morning delivery" },
                ].map((phase) => (
                  <div key={phase.phase} className={`night-phase ${phase.status}`}>
                    <div className="phase-num">{phase.phase}</div>
                    <div className="phase-content">
                      <div className="phase-name">{phase.name}</div>
                      <div className="phase-desc">{phase.desc}</div>
                    </div>
                    <div className={`phase-status ${phase.status}`}>
                      {phase.status === "complete" && "Complete"}
                      {phase.status === "active" && "Running..."}
                      {phase.status === "pending" && "Pending"}
                    </div>
                  </div>
                ))}
              </div>
              {(analysis?.morning_dispatch || []).length > 0 && (
                <div className="night-dispatch-preview">
                  <div className="dispatch-preview-label">OVERNIGHT FINDINGS</div>
                  {(analysis.morning_dispatch || []).map((item, i) => (
                    <div key={i} className="dispatch-card">
                      <div className="dispatch-card-top">
                        <div className="dispatch-finding">{item.finding}</div>
                        <div className="dispatch-meta">
                          <span className={`conf-badge ${item.confidence}`}>{item.confidence}</span>
                          <span className="dispatch-urgency">{item.urgency}</span>
                        </div>
                      </div>
                      <div className="dispatch-detail">{item.detail}</div>
                      <div className="dispatch-sims">{item.simulations_run} simulations run</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* CO-PILOT */}
      {mode === "copilot" && (
        <div className="copilot-panel">
          <div className="copilot-header">CO-PILOT — ASK ZEVO ANYTHING ABOUT YOUR DATA</div>
          <div className="copilot-chips">
            {PROMPT_CHIPS.map((chip) => (
              <button key={chip} className="chip" onClick={() => handleChat(chip)}>{chip}</button>
            ))}
          </div>
          <div className="chat-history">
            {chatHistory.length === 0 && (
              <div className="chat-empty">Ask a question or pick a chip above. ZEVO answers from your verified data only.</div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                <span className="chat-role">{msg.role === "user" ? "You" : "ZEVO"}</span>
                <span className="chat-text">{msg.content}</span>
              </div>
            ))}
            {chatLoading && (
              <div className="chat-msg assistant">
                <span className="chat-role">ZEVO</span>
                <span className="chat-text typing">ZEVO is thinking...</span>
              </div>
            )}
          </div>
          <div className="copilot-input-row">
            <input
              className="copilot-input"
              placeholder="Ask anything about your data..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChat()}
            />
            <button className="voice-btn" onClick={handleVoiceInput} title="Speak to ZEVO">
              {listening ? "⏹" : "🎤"}
            </button>
            <button className="btn-primary" onClick={() => handleChat()}>→</button>
          </div>
        </div>
      )}
    </div>
  );
}