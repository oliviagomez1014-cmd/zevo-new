import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { chatWithZevo, runScenario, runRealitySearch } from "../utils/claudeApi";

const DEFAULT_COLORS = ["#FF1E3C", "#3B4FFF", "#00FF88", "#FFB800", "#a78bfa", "#22D3EE"];

const PROMPT_CHIPS = [
  "What is my biggest risk?",
  "Find top performing products",
  "Which region is underperforming?",
  "What should I focus on this week?",
  "How can I improve profitability?",
  "What is the most urgent action?",
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
  const [chartColor, setChartColor] = useState("#FF1E3C");
  const [chartType, setChartType] = useState("bar");
  const [darkMode, setDarkMode] = useState(true);
  const [memory, setMemory] = useState([]);

  const kpis = analysis?.kpi_cards || [];
  const anomalies = analysis?.anomalies || [];
  const insights = analysis?.insights || [];
  const chartSuggestions = analysis?.chart_suggestions || [];
  const chartData = analysis?.chart_data || {};
  const confidence = analysis?.confidence || {};

useEffect(() => {
  const saved = localStorage.getItem("zevo_memory");
  if (saved) setMemory(JSON.parse(saved));
}, []);

useEffect(() => {
  if (analysis) {
    const entry = {
      date: new Date().toLocaleString(),
      rows: analysis.data_stats?.total_rows || 0,
      anomalies: anomalies.length,
      insights: insights.length,
      story: analysis.data_story || "",
    };
    const updated = [entry, ...memory].slice(0, 10);
    setMemory(updated);
    localStorage.setItem("zevo_memory", JSON.stringify(updated));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [analysis]);

  useEffect(() => {
    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium")
      );
      if (preferred) utterance.voice = preferred;
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

  const handleExportPDF = () => {
    const printContent = document.querySelector(".dash-body");
    if (!printContent) { window.print(); return; }
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>ZEVO — Strategic Brief</title>
          <style>
            body { font-family: 'Inter', sans-serif; background: #050508; color: #F0F4FF; padding: 40px; }
            h1 { color: #FF1E3C; font-size: 32px; margin-bottom: 8px; }
            .subtitle { color: #7A8499; margin-bottom: 32px; }
            .section { margin-bottom: 28px; }
            .section-title { font-size: 11px; font-weight: 800; letter-spacing: 3px; color: #FF1E3C; text-transform: uppercase; margin-bottom: 12px; }
            .card { background: #0C0C18; border: 1px solid rgba(255,30,60,0.15); border-radius: 10px; padding: 16px; margin-bottom: 10px; }
            .card-title { font-weight: 700; margin-bottom: 6px; }
            .card-detail { color: #7A8499; font-size: 13px; line-height: 1.7; }
            .footer { margin-top: 48px; color: #3D4560; font-size: 12px; border-top: 1px solid rgba(255,30,60,0.1); padding-top: 16px; }
          </style>
        </head>
        <body>
          <h1>ZEVO — Morning Brief</h1>
          <div class="subtitle">${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · ${analysis?.data_stats?.total_rows || 0} rows analysed</div>
          
          <div class="section">
            <div class="section-title">Urgent</div>
            ${(analysis?.ceo_briefing?.urgent || []).map(i => `<div class="card"><div class="card-title">${i.title}</div><div class="card-detail">${i.detail}</div></div>`).join("")}
          </div>
          
          <div class="section">
            <div class="section-title">Watch</div>
            ${(analysis?.ceo_briefing?.watch || []).map(i => `<div class="card"><div class="card-title">${i.title}</div><div class="card-detail">${i.detail}</div></div>`).join("")}
          </div>

          <div class="section">
            <div class="section-title">Insights</div>
            ${(analysis?.insights || []).map(i => `<div class="card"><div class="card-title">${i.title}</div><div class="card-detail">${i.detail}</div></div>`).join("")}
          </div>

          <div class="section">
            <div class="section-title">Strategic Analysis</div>
            <div class="card"><div class="card-detail">${analysis?.data_story || ""}</div></div>
          </div>

          <div class="footer">Generated by ZEVO Business Physics Engine · Employees work 9 to 5. ZEVO works 5 to 9.</div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const statusColor = (s) => s === "critical" ? "#FF1E3C" : s === "warning" ? "#FFB800" : "#00FF88";
  const trendArrow = (trend, pct) => {
    if (trend === "up") return <span className="trend up">↑ {pct || ""}</span>;
    if (trend === "down") return <span className="trend down">↓ {pct || ""}</span>;
    return <span className="trend neutral">→</span>;
  };
  const getEmoji = (code) => code === "RED" ? "🔴" : code === "YELLOW" ? "🟡" : code === "GREEN" ? "🟢" : code;

  const renderChart = (chart, i) => {
    const key = `${chart.x_column}_${chart.y_column}`;
    const data = chartData[key];
    if (!data || data.length === 0) return null;
    const type = chartType || chart.type;
    const color = chartColor;
    return (
      <div key={i} className="chart-card">
        <div className="chart-card-header">
          <div className="chart-title">{chart.title}</div>
          <div className="chart-controls">
            <input type="color" value={chartColor} onChange={(e) => setChartColor(e.target.value)} title="Chart color" className="color-picker" />
            <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="chart-type-select">
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="pie">Pie</option>
            </select>
          </div>
        </div>
        <div className="chart-insight">{chart.insight}</div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={220}>
            {type === "bar" ? (
              <BarChart data={data}>
                <XAxis dataKey={chart.x_column} tick={{ fontSize: 11, fill: "#7A8499" }} />
                <YAxis tick={{ fontSize: 11, fill: "#7A8499" }} />
                <Tooltip contentStyle={{ background: "#0C0C18", border: "1px solid rgba(255,30,60,0.2)", color: "#F0F4FF", borderRadius: "8px" }} />
                <Bar dataKey={chart.y_column} fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : type === "line" ? (
              <LineChart data={data}>
                <XAxis dataKey={chart.x_column} tick={{ fontSize: 11, fill: "#7A8499" }} />
                <YAxis tick={{ fontSize: 11, fill: "#7A8499" }} />
                <Tooltip contentStyle={{ background: "#0C0C18", border: "1px solid rgba(255,30,60,0.2)", color: "#F0F4FF", borderRadius: "8px" }} />
                <Line type="monotone" dataKey={chart.y_column} stroke={color} strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <PieChart>
                <Pie data={data} dataKey={chart.y_column} nameKey={chart.x_column} cx="50%" cy="50%" outerRadius={80}>
                  {data.map((_, index) => (
                    <Cell key={index} fill={index === 0 ? color : DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0C0C18", border: "1px solid rgba(255,30,60,0.2)", color: "#F0F4FF", borderRadius: "8px" }} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="dash-topbar">
        <div className="dash-page-title">
          {activeTab === "overview" && "Overview"}
          {activeTab === "anomalies" && `Anomalies ${anomalies.length > 0 ? `(${anomalies.length})` : ""}`}
          {activeTab === "insights" && "Insights"}
          {activeTab === "charts" && "Charts"}
          {activeTab === "scenarios" && "Scenarios"}
          {activeTab === "reality" && "Reality Search"}
          {activeTab === "memory" && "Business Memory"}
          {activeTab === "night" && "Infinite Night"}
          {activeTab === "settings" && "Settings"}
        </div>
        <div className="dash-actions">
          <button className="btn-ghost" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button className="btn-ghost" onClick={onCEOMode}>Morning Brief</button>
          <button className="btn-ghost" onClick={onNewUpload}>New Upload</button>
          <button className="btn-primary" onClick={handleExportPDF}>Export PDF</button>
        </div>
      </div>

      <div className="mode-bar">
        <div className="mode-toggle">
          <button className={`mode-btn ${mode === "autopilot" ? "active" : ""}`} onClick={() => onModeChange("autopilot")}>Autopilot</button>
          <button className={`mode-btn ${mode === "copilot" ? "active" : ""}`} onClick={() => onModeChange("copilot")}>Co-Pilot</button>
        </div>
        <div className="confidence-bar">
          <span className="conf-label">Data quality:</span>
          <span className="conf-value">{confidence.overall}%</span>
          <span className="conf-rows">{confidence.clean_rows}/{confidence.total_rows} clean rows</span>
        </div>
      </div>

      <div className="dash-body">

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
                      <span className="anom-sev">{a.severity === "critical" ? "🔴" : "🟡"}</span>
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

        {activeTab === "anomalies" && (
          <div className="tab-content">
            <p className="tab-intro">Every anomaly sourced from verified data. Click Explain for full reasoning.</p>
            {anomalies.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <div className="empty-title">Everything looks healthy</div>
                <div className="empty-sub">No anomalies detected in your data.</div>
              </div>
            ) : anomalies.map((a, i) => (
              <div key={i} className={`anomaly-card ${a.severity}`} style={{ marginBottom: "10px" }}>
                <div className="anomaly-top">
                  <span className="anom-sev-icon">{a.severity === "critical" ? "🔴" : "🟡"}</span>
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
                      <div className="explain-level-label">Simple</div>
                      <div className="explain-level-text">{a.explanation.simple}</div>
                    </div>
                    <div className="explain-level">
                      <div className="explain-level-label">Business Reasoning</div>
                      <div className="explain-level-text">{a.explanation.business}</div>
                    </div>
                    <div className="explain-level">
                      <div className="explain-level-label">Full Calculation</div>
                      <div className="explain-level-text calculation">{a.explanation.calculation}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "insights" && (
          <div className="tab-content">
            <p className="tab-intro">Analyst-level insights from your verified data.</p>
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
        )}

        {activeTab === "charts" && (
          <div className="tab-content">
            <div className="charts-grid">
              {chartSuggestions.map((chart, i) => renderChart(chart, i))}
              {chartSuggestions.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <div className="empty-title">No charts generated</div>
                  <div className="empty-sub">Upload a file with numeric columns.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "scenarios" && (
          <div className="tab-content">
            <div className="scenario-header">
              <h3>Scenario Simulator</h3>
              <p>Model what-if decisions on your actual data.</p>
              <div className="scenario-disclaimer">Simulation — not a guaranteed prediction.</div>
            </div>
            <div className="scenario-input-area">
              <input className="scenario-input" placeholder='e.g. "What if I increase prices by 10%?"' value={scenarioInput} onChange={(e) => setScenarioInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleScenario()} />
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
              </div>
            )}
          </div>
        )}

        {activeTab === "reality" && (
          <div className="tab-content">
            <div className="scenario-header">
              <h3>Reality Search</h3>
              <p>Describe a future worth creating. ZEVO finds the strongest paths to get there.</p>
            </div>
            <div className="scenario-input-area">
              <input className="scenario-input" placeholder='e.g. "Find futures where revenue grows 30%"' value={realityInput} onChange={(e) => setRealityInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRealitySearch()} />
              <button className="btn-primary" onClick={handleRealitySearch} disabled={realityLoading}>
                {realityLoading ? "Searching..." : "Search →"}
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
                        {future.key_moves?.map((move, j) => <div key={j} className="path-move">→ {move}</div>)}
                      </div>
                      <div className="path-risk">Risk: {future.biggest_risk}</div>
                      <div className="path-first-step">First step: <strong>{future.first_step}</strong></div>
                      {i === 0 && <div className="path-recommended-badge">ZEVO Recommended</div>}
                    </div>
                  ))}
                </div>
                {realityResult.recommended_path && (
                  <div className="reality-recommendation">{realityResult.recommended_path}</div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "night" && (
          <div className="tab-content">
            <div className="engine-hero">
              <div className="engine-eyebrow">CORE SYSTEM</div>
              <h2 className="engine-title">Infinite Night</h2>
              <p className="engine-desc">While your team sleeps, ZEVO runs its night cycle. Every morning your company wakes up smarter.</p>
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
                  {analysis.morning_dispatch.map((item, i) => (
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

        {activeTab === "memory" && (
          <div className="tab-content">
            <div className="engine-hero">
              <div className="engine-eyebrow">BUSINESS MEMORY</div>
              <h2 className="engine-title">Company Memory</h2>
              <p className="engine-desc">ZEVO never forgets. Every session is stored locally so your analysis history builds over time.</p>
            </div>
            <div className="memory-stats">
              <div className="memory-stat">
                <div className="memory-stat-num">{memory.length}</div>
                <div className="memory-stat-label">Sessions</div>
              </div>
              <div className="memory-stat">
                <div className="memory-stat-num">{memory.reduce((a, b) => a + (b.rows || 0), 0).toLocaleString()}</div>
                <div className="memory-stat-label">Rows Analysed</div>
              </div>
              <div className="memory-stat">
                <div className="memory-stat-num">{memory.reduce((a, b) => a + (b.anomalies || 0), 0)}</div>
                <div className="memory-stat-label">Anomalies Found</div>
              </div>
              <div className="memory-stat">
                <div className="memory-stat-num">{memory.reduce((a, b) => a + (b.insights || 0), 0)}</div>
                <div className="memory-stat-label">Insights Generated</div>
              </div>
            </div>
            {memory.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🧠</div>
                <div className="empty-title">No sessions yet</div>
                <div className="empty-sub">Upload your first file to start building ZEVO's memory.</div>
              </div>
            ) : (
              <div className="memory-timeline">
                {memory.map((m, i) => (
                  <div key={i} className="memory-item">
                    <div className="memory-dot" />
                    <div className="memory-time">{m.date}</div>
                    <div className="memory-content">
                      <div className="memory-title">{m.rows.toLocaleString()} rows analysed</div>
                      <div className="memory-detail">{m.anomalies} anomalies · {m.insights} insights · {m.story?.slice(0, 120)}...</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-ghost" style={{ marginTop: "16px" }} onClick={() => { localStorage.removeItem("zevo_memory"); setMemory([]); }}>
              Clear Memory
            </button>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="tab-content">
            <div className="engine-hero">
              <div className="engine-eyebrow">SYSTEM</div>
              <h2 className="engine-title">Settings</h2>
              <p className="engine-desc">Customise your ZEVO experience.</p>
            </div>
            <div className="settings-grid">
              <div className="setting-card">
                <div className="setting-label">Theme</div>
                <div className="setting-control">
                  <button className="btn-ghost" onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? "Switch to Light Mode ☀️" : "Switch to Dark Mode 🌙"}
                  </button>
                </div>
              </div>
              <div className="setting-card">
                <div className="setting-label">Chart Color</div>
                <div className="setting-control">
                  <input type="color" value={chartColor} onChange={(e) => setChartColor(e.target.value)} className="color-picker-large" />
                  <span style={{ color: "var(--text-sec)", fontSize: "13px", marginLeft: "10px" }}>{chartColor}</span>
                </div>
              </div>
              <div className="setting-card">
                <div className="setting-label">Default Chart Type</div>
                <div className="setting-control">
                  <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="chart-type-select">
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                  </select>
                </div>
              </div>
              <div className="setting-card">
                <div className="setting-label">Business Memory</div>
                <div className="setting-control">
                  <button className="btn-ghost" onClick={() => { localStorage.removeItem("zevo_memory"); setMemory([]); alert("Memory cleared."); }}>
                    Clear All Memory
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

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
              <div className="chat-empty">Ask a question or tap a chip. ZEVO answers from your verified data only.</div>
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
