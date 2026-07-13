export default function Sidebar({ activeTab, onTabChange }) {
  const navItems = [
    { id: "briefing", label: "Morning Brief", icon: "◈", section: "Intelligence", dot: true },
    { id: "night", label: "Infinite Night", icon: "◐", section: "Intelligence" },
    { id: "overview", label: "Overview", icon: "◎", section: "Analysis" },
    { id: "anomalies", label: "Anomalies", icon: "◬", section: "Analysis" },
    { id: "insights", label: "Insights", icon: "⬡", section: "Analysis" },
    { id: "charts", label: "Charts", icon: "◇", section: "Analysis" },
    { id: "scenarios", label: "Decision Lab", icon: "◉", section: "Analysis" },
    { id: "reality", label: "Reality Search", icon: "▣", section: "Analysis" },
    { id: "futures", label: "Future Council", icon: "◈", section: "Strategic Engines" },
    { id: "evolution", label: "Evolution Engine", icon: "◐", section: "Strategic Engines" },
    { id: "genome", label: "Decision Genome", icon: "◎", section: "Strategic Engines" },
    { id: "memory", label: "Company Memory", icon: "◬", section: "Strategic Engines" },
    { id: "settings", label: "Settings", icon: "◫", section: "System" },
  ];

  const sections = ["Intelligence", "Analysis", "Strategic Engines", "System"];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="zevo-logo">
          <span className="zevo-logo-cursive">Z</span>
          <span className="zevo-logo-bold">EVO</span>
        </div>
        <div className="zevo-tagline">Business Physics Engine</div>
        <div className="zevo-status">
          <div className="zevo-status-dot" />
          <span>Infinite Night — Active</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {navItems
              .filter((item) => item.section === section)
              .map((item) => (
                <div
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => onTabChange(item.id)}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {item.label}
                  {item.dot && activeTab !== item.id && (
                    <span className="nav-item-dot" />
                  )}
                </div>
              ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="user-avatar">M</div>
          <div className="user-info">
            <div className="user-name">Michelle</div>
            <div className="user-role">Chief Executive</div>
          </div>
        </div>
      </div>
    </div>
  );
}