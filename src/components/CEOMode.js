import { speakHuman } from "../utils/voiceEngine";
export default function CEOMode({ analysis, profile, onViewDashboard, onNewUpload }) {
  const briefing = analysis?.ceo_briefing || {};
  const confidence = analysis?.confidence || {};
  const changelog = analysis?.changelog || [];
  const dispatch = analysis?.morning_dispatch || [];
  const butterfly = analysis?.butterfly_findings || [];
 

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const readBriefAloud = () => {
    if (!("speechSynthesis" in window)) return;
    const urgent = (briefing.urgent || []).map(i => `${i.title}. ${i.detail}`).join(" ");
    const watch = (briefing.watch || []).map(i => `${i.title}. ${i.detail}`).join(" ");
    const healthy = (briefing.healthy || []).map(i => `${i.title}. ${i.detail}`).join(" ");
    const action = briefing.top_action?.action || "";
    const text = `${briefing.greeting} ${urgent} ${watch} ${healthy} Today's top action: ${action}`;
speakHuman(text);
  };

  const getEmoji = (code) => {
    if (code === "RED") return "🔴";
    if (code === "YELLOW") return "🟡";
    if (code === "GREEN") return "🟢";
    return code;
  };

  return (
    <div className="ceo-screen">
      <div className="ceo-header">
        <div className="zevo-wordmark-sm">
          <span className="zevo-wordmark-cursive">Z</span>
          <span className="zevo-wordmark-bold">EVO</span>
        </div>
        <div className="ceo-header-actions">
          <button className="btn-ghost" onClick={readBriefAloud}>
            🔊 Read Aloud
          </button>
          <button className="btn-ghost" onClick={onNewUpload}>
            New Upload
          </button>
          <button className="btn-primary" onClick={onViewDashboard}>
            Full Dashboard →
          </button>
        </div>
      </div>

      <div className="ceo-content">
        {changelog.length > 0 && (
          <div className="data-health-bar">
            <span className="health-icon">🔧</span>
            <span className="health-text">
              Auto-cleaned: {changelog.join(" · ")}
            </span>
            <span className="confidence-badge">
              {confidence.overall >= 80 ? "★★★★★" :
               confidence.overall >= 60 ? "★★★★☆" :
               confidence.overall >= 40 ? "★★★☆☆" : "★★☆☆☆"}
              &nbsp;{confidence.clean_rows}/{confidence.total_rows} clean rows
            </span>
          </div>
        )}

        <div className="ceo-briefing">
          <div className="briefing-greeting">
            {getGreeting()}.{" "}
            {profile?.industry
              ? `Here is what matters in your ${profile.industry} business today.`
              : "Your company evolved while you were asleep."}
          </div>

          <div className="briefing-cards">
            {(briefing.urgent || []).map((item, i) => (
              <div key={i} className="briefing-card urgent">
                <div className="briefing-card-header">
                  <span className="briefing-emoji">{getEmoji(item.emoji)}</span>
                  <span className="briefing-severity urgent-label">Urgent</span>
                </div>
                <div className="briefing-title">{item.title}</div>
                <div className="briefing-detail">{item.detail}</div>
                {item.action && (
                  <div className="briefing-action">→ {item.action}</div>
                )}
              </div>
            ))}

            {(briefing.watch || []).map((item, i) => (
              <div key={i} className="briefing-card watch">
                <div className="briefing-card-header">
                  <span className="briefing-emoji">{getEmoji(item.emoji)}</span>
                  <span className="briefing-severity watch-label">Watch</span>
                </div>
                <div className="briefing-title">{item.title}</div>
                <div className="briefing-detail">{item.detail}</div>
              </div>
            ))}

            {(briefing.healthy || []).map((item, i) => (
              <div key={i} className="briefing-card healthy">
                <div className="briefing-card-header">
                  <span className="briefing-emoji">{getEmoji(item.emoji)}</span>
                  <span className="briefing-severity healthy-label">Healthy</span>
                </div>
                <div className="briefing-title">{item.title}</div>
                <div className="briefing-detail">{item.detail}</div>
              </div>
            ))}
          </div>

          {briefing.top_action && (
            <div className="top-action-card">
              <div className="top-action-label">TODAY'S TOP ACTION</div>
              <div className="top-action-text">{briefing.top_action.action}</div>
              <div className="top-action-impact">
                <span className="impact-label">Estimated impact: </span>
                {briefing.top_action.impact}
              </div>
              <div className="top-action-assumption">
                <span className="assumption-label">Assumption: </span>
                {briefing.top_action.assumption}
              </div>
            </div>
          )}
        </div>

        {dispatch.length > 0 && (
          <div className="dispatch-section">
            <div className="dispatch-header">
              <span className="dispatch-icon">🌙</span>
              <div>
                <div className="dispatch-title">Infinite Night — Overnight Findings</div>
                <div className="dispatch-sub">
                  ZEVO analysed your data and surfaced these discoveries
                </div>
              </div>
            </div>
            <div className="dispatch-cards">
              {dispatch.map((item, i) => (
                <div key={i} className="dispatch-card">
                  <div className="dispatch-card-top">
                    <div className="dispatch-finding">{item.finding}</div>
                    <div className="dispatch-meta">
                      <span className={`conf-badge ${item.confidence}`}>
                        {item.confidence}
                      </span>
                      <span className="dispatch-urgency">{item.urgency}</span>
                    </div>
                  </div>
                  <div className="dispatch-detail">{item.detail}</div>
                  <div className="dispatch-sims">
                    {item.simulations_run} simulations run overnight
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {butterfly.length > 0 && (
          <div className="butterfly-section">
            <div className="butterfly-header">
              <span style={{ fontSize: "24px" }}>🦋</span>
              <div>
                <div className="butterfly-title">Butterfly Engine — Hidden Leverage Points</div>
                <div className="butterfly-sub">
                  Small changes with disproportionate business impact
                </div>
              </div>
            </div>
            <div className="butterfly-cards">
              {butterfly.map((item, i) => (
                <div key={i} className="butterfly-card">
                  <div className="butterfly-change">{item.small_change}</div>
                  <div className="butterfly-cascade">
                    <span className="cascade-label">Cascade: </span>
                    {item.cascade_effect}
                  </div>
                  <div className="butterfly-numbers">
                    <div className="butterfly-impact">
                      <span className="bn-label">Impact</span>
                      <span className="bn-value">{item.estimated_impact}</span>
                    </div>
                    <div className="butterfly-cost">
                      <span className="bn-label">Cost</span>
                      <span className="bn-value">{item.implementation_cost}</span>
                    </div>
                    <div className="butterfly-roi">
                      <span className="bn-label">ROI</span>
                      <span className="bn-value highlight">{item.roi}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis?.data_story && (
          <div className="data-story">
            <div className="data-story-label">THE FULL PICTURE</div>
            <p>{analysis.data_story}</p>
          </div>
        )}

        <div className="ceo-footer">
          <button className="ceo-dashboard-btn" onClick={onViewDashboard}>
            View Full Dashboard — Charts, Insights, Scenarios and Reality Search →
          </button>
          <p className="ceo-footer-note">
            Employees work 9 to 5. ZEVO works 5 to 9.
          </p>
        </div>
      </div>
    </div>
  );
}