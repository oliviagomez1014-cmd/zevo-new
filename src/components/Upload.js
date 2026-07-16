import { useState, useRef } from "react";

export default function Upload({
  onFileSelected,
  error,
  darkMode,
  setDarkMode,
}) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const valid = [".csv", ".xlsx", ".xls"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!valid.includes(ext)) {
      alert("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }
    setFileName(file.name);
    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const engines = [
    {
      num: "01",
      name: "Future Council",
      description: "Every night ZEVO convenes an immortal board of directors — 300 IQ, no ego, no sleep — that debates which future your company should inhabit and what is stopping it from getting there.",
    },
    {
      num: "02",
      name: "Infinite Night",
      description: "While your team sleeps, ZEVO runs millions of simulations, invents new business models, challenges every assumption, and hands the CEO a strategic brief every morning. Not a report. A discovery.",
    },
    {
      num: "03",
      name: "Evolution Engine",
      description: "ZEVO does not optimize your current company. It designs the next version of it — new pricing architectures, organizational redesigns, market expansions, product concepts, and hiring structures.",
    },
    {
      num: "04",
      name: "Decision Genome",
      description: "ZEVO learns how your company naturally makes decisions — where it is systematically slow, where it consistently over-invests, what blind spots repeat — and intervenes before the pattern strikes again.",
    },
    {
      num: "05",
      name: "Butterfly Engine",
      description: "Not anomalies. Not insights. True leverage points — the single small decisions that cascade into transformational business outcomes most companies never discover until it is too late.",
    },
    {
      num: "06",
      name: "Reality Search",
      description: "You do not ask ZEVO what happened. You search for futures worth creating. Describe where you want to be and ZEVO maps the strongest paths to get there from where you actually stand today.",
    },
  ];

  // const steps = [
  //   { num: "05", label: "5 PM", desc: "Your team goes home" },
  //   { num: "→", label: "Night Cycle", desc: "ZEVO begins its work" },
  //   { num: "09", label: "9 AM", desc: "Your company wakes up smarter" },
  // ];

  return (
      <div className="lp-root">
      <div className="lp-grid-bg" />
      <div className="lp-radial-1" />
      <div className="lp-radial-2" />

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <span className="lp-logo-text">
            <span className="lp-logo-cursive">Z</span>
            <span className="lp-logo-bold">EVO</span>
          </span>
        </div>
        <div className="lp-nav-links">
          <span>The Engine</span>
          <span>How It Works</span>
          <span>Philosophy</span>
          <span>For Founders</span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
  <button
    onClick={() => setDarkMode(!darkMode)}
    className="theme-toggle"
  >
    {darkMode ? "☀️" : "🌙"}
  </button>

  <button
    className="lp-nav-cta"
    onClick={() => inputRef.current.click()}
  >
    Upload Your Data →
  </button>
</div>
        
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-eyebrow">
          <div className="lp-eyebrow-line" />
          NOT AI. NOT BI. NOT A TOOL.
          <div className="lp-eyebrow-line" />
        </div>

        <div className="lp-hero-logo-wrap">
          <div className="lp-hero-logo">
            <span className="lp-hero-logo-cursive">Z</span>
            <span className="lp-hero-logo-bold">EVO</span>
          </div>
          <div className="lp-hero-logo-glow" />
        </div>

        <h1 className="lp-hero-headline">
          Employees work <span className="lp-red">9 to 5.</span><br />
          ZEVO works <span className="lp-red">5 to 9.</span>
        </h1>

        <p className="lp-hero-sub">
          Imagine your company hired an immortal executive board — 300 IQ,
          no ego, no sleep, infinite memory — that debated strategy every
          night and handed the CEO a brief every morning.
          <br /><br />
          That is ZEVO.
        </p>

        <div className="lp-hero-question">
          <div className="lp-question-label">THE QUESTION ZEVO ASKS</div>
          <div className="lp-question-text">
            "Which future is worth creating — and what is stopping this company from becoming a ₹1,00,000 crore business?"
          </div>
        </div>

        <div className="lp-hero-btns">
          <button className="lp-btn-primary" onClick={() => inputRef.current.click()}>
            Begin Tonight →
          </button>
          <button className="lp-btn-outline">
            See What ZEVO Found
          </button>
        </div>

        <div className="lp-hero-disclaimer">
          Upload your business data. ZEVO activates immediately.
          No prompts. No configuration. No waiting.
        </div>
      </section>

      {/* UPLOAD SECTION */}
      <section className="lp-upload-section">
        <div className="lp-upload-card">
          <div className="lp-upload-card-left">
            <div className="lp-upload-eyebrow">YOUR FIRST MORNING BRIEF</div>
            <h2 className="lp-upload-headline">
              Drop your data.<br />
              Wake up to a <span className="lp-red">different company.</span>
            </h2>
            <p className="lp-upload-desc">
              Upload any business data file. ZEVO runs its first analysis
              immediately — not a dashboard, not a report, but the first
              dispatch from your new executive board.
            </p>
            <div className="lp-upload-formats">
              <span className="lp-format-tag">XLSX</span>
              <span className="lp-format-tag">XLS</span>
              <span className="lp-format-tag">CSV</span>
            </div>
            <div className="lp-upload-trust">
              <div className="lp-trust-row">
                <div className="lp-trust-dot" />
                Your data never leaves your browser
              </div>
              <div className="lp-trust-row">
                <div className="lp-trust-dot" />
                All calculations verified before ZEVO interprets them
              </div>
              <div className="lp-trust-row">
                <div className="lp-trust-dot" />
                Not used for AI training. Ever.
              </div>
            </div>
          </div>

          <div className="lp-upload-card-right">
            <div
              className={`lp-dropzone ${dragging ? "dragging" : ""} ${fileName ? "has-file" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {fileName ? (
                <>
                  <div className="lp-drop-icon-wrap success">
                    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="lp-drop-filename">{fileName}</div>
                  <div className="lp-drop-status">ZEVO is activating...</div>
                </>
              ) : (
                <>
                  <div className="lp-drop-icon-wrap">
                    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="lp-drop-main">Drop your business data here</div>
                  <div className="lp-drop-or">or click to browse</div>
                  <div className="lp-drop-limit">Excel or CSV · Up to 50MB</div>
                </>
              )}
            </div>
            {error && <div className="lp-error">⚠ {error}</div>}
          </div>
        </div>
      </section>

      {/* THE PHILOSOPHY */}
      <section className="lp-philosophy-section">
        <div className="lp-section-eyebrow">THE PHILOSOPHY</div>
        <div className="lp-philosophy-grid">
          <div className="lp-philosophy-left">
            <h2 className="lp-philosophy-headline">
              Every tool answers<br />
              what happened.<br />
              <span className="lp-red">ZEVO asks which<br />future should exist.</span>
            </h2>
          </div>
          <div className="lp-philosophy-right">
            <div className="lp-philosophy-compare">
              <div className="lp-compare-row old">
                <div className="lp-compare-label">Power BI, Tableau, Dashboards</div>
                <div className="lp-compare-question">"What happened last quarter?"</div>
              </div>
              <div className="lp-compare-row old">
                <div className="lp-compare-label">ChatGPT, Copilot, AI Assistants</div>
                <div className="lp-compare-question">"Why did this happen?"</div>
              </div>
              <div className="lp-compare-row old">
                <div className="lp-compare-label">Forecasting Tools, BI Platforms</div>
                <div className="lp-compare-question">"What might happen next?"</div>
              </div>
              <div className="lp-compare-divider" />
              <div className="lp-compare-row new">
                <div className="lp-compare-label zevo-label">ZEVO</div>
                <div className="lp-compare-question zevo-question">
                  "Which future is worth creating — and how do we build it?"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE 6 ENGINES */}
      <section className="lp-features-section">
        <div className="lp-section-eyebrow">THE SIX ENGINES</div>
        <h2 className="lp-section-headline">
          Not features. Not tools.<br />
          <span className="lp-red">Autonomous strategic intelligence.</span>
        </h2>
        <p className="lp-section-sub">
          Every night, ZEVO's six engines run simultaneously — researching,
          simulating, debating, and designing the next version of your company.
          No prompts. No dashboards. Just strategic intelligence delivered
          every morning.
        </p>
        <div className="lp-features-grid">
          {engines.map((e) => (
            <div key={e.num} className="lp-feature-card">
              <div className="lp-feature-num">{e.num}</div>
              <h3 className="lp-feature-title">{e.name}</h3>
              <p className="lp-feature-desc">{e.description}</p>
              <div className="lp-feature-arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-how-section">
        <div className="lp-section-eyebrow">HOW IT WORKS</div>
        <h2 className="lp-section-headline">
          Your company never stops<br />
          <span className="lp-red">thinking again.</span>
        </h2>
        <div className="lp-timeline">
          <div className="lp-timeline-line" />
          {[
            { time: "5:00 PM", title: "Your team goes home", desc: "ZEVO begins its night cycle. Every department. Every metric. Every assumption." },
            { time: "10:00 PM", title: "Hypothesis generation", desc: "ZEVO invents research questions your team has never thought to ask." },
            { time: "2:00 AM", title: "Simulation engine activates", desc: "Millions of future scenarios computed against your actual business data." },
            { time: "5:00 AM", title: "Challenge and validation", desc: "ZEVO argues against its own findings. Only the strongest survive." },
            { time: "7:00 AM", title: "Morning brief delivered", desc: "The CEO arrives to discoveries, not dashboards. Decisions, not data." },
          ].map((item, i) => (
            <div key={i} className="lp-timeline-item">
              <div className="lp-timeline-dot" />
              <div className="lp-timeline-time">{item.time}</div>
              <div className="lp-timeline-content">
                <div className="lp-timeline-title">{item.title}</div>
                <div className="lp-timeline-desc">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MORNING BRIEF PREVIEW */}
      <section className="lp-brief-section">
        <div className="lp-section-eyebrow">WHAT ZEVO DELIVERS EVERY MORNING</div>
        <h2 className="lp-section-headline">
          Not a report. A brief from<br />
          <span className="lp-red">your executive board.</span>
        </h2>
        <div className="lp-brief-card">
          <div className="lp-brief-header">
            <div className="lp-brief-meta">
              <span className="lp-brief-label">MORNING DISPATCH</span>
              <span className="lp-brief-date">Tuesday, 7:00 AM</span>
            </div>
            <div className="lp-brief-sims">4,283,912 simulations completed overnight</div>
          </div>
          <div className="lp-brief-items">
            <div className="lp-brief-item critical">
              <div className="lp-brief-item-dot critical" />
              <div>
                <div className="lp-brief-item-title">Pricing architecture is destroying enterprise LTV</div>
                <div className="lp-brief-item-desc">Current tiered model creates a ceiling at ₹2.4L ARR per client. Restructuring to outcome-based pricing unlocks an estimated ₹18Cr in untapped revenue from existing accounts alone.</div>
              </div>
            </div>
            <div className="lp-brief-item warning">
              <div className="lp-brief-item-dot warning" />
              <div>
                <div className="lp-brief-item-title">Southeast Asia expansion window is closing</div>
                <div className="lp-brief-item-desc">Three competitors entered Vietnam in the last 90 days. The distribution advantage that made your India expansion successful exists in exactly one other market today — and that window closes in 6 months.</div>
              </div>
            </div>
            <div className="lp-brief-item opportunity">
              <div className="lp-brief-item-dot opportunity" />
              <div>
                <div className="lp-brief-item-title">Engineering hired before Sales is a ₹9Cr mistake</div>
                <div className="lp-brief-item-desc">Your current hiring sequence increases time-to-revenue by 4.2 months per cycle. Reversing the order — Sales first, Engineering 60 days later — generates ₹9.3Cr in additional revenue over 24 months at current conversion rates.</div>
              </div>
            </div>
          </div>
          <div className="lp-brief-footer">
            ZEVO identified 5 strategic opportunities, 2 emerging risks, and 1 critical decision requiring immediate action this morning.
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-left">
          <span className="lp-logo-text">
            <span className="lp-logo-cursive">Z</span>
            <span className="lp-logo-bold-sm">EVO</span>
          </span>
          <span className="lp-footer-copy">© 2026 ZEVO. Business Physics Engine.</span>
        </div>
        <div className="lp-footer-tagline">
          Employees work 9 to 5. ZEVO works 5 to 9.
        </div>
        <div className="lp-footer-links">
          <span>The Engine</span>
          <span>Philosophy</span>
          <span>For Founders</span>
          <span>LinkedIn</span>
        </div>
      </footer>
    </div>
  );
}