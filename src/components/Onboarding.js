import { useState } from "react";

const industries = [
  "Fashion & Apparel",
  "Beauty & Skincare",
  "Electronics",
  "Food & Beverage",
  "Furniture & Home",
  "Health & Wellness",
  "Other",
];

const priorities = [
  "Revenue Growth",
  "Profitability",
  "Cash Flow",
  "Inventory Clearance",
];

const audiences = [
  "Just me",
  "My manager",
  "Investors / Board",
  "My team",
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    industry: "",
    priority: "",
    audience: "",
    revenue_target: "",
    cac_target: "",
  });

  const steps = [
    {
      question: "What best describes your business?",
      subtitle: "PULSE loads different KPI benchmarks and intelligence based on your category.",
      field: "industry",
      options: industries,
    },
    {
      question: "What is your current business priority?",
      subtitle: "Every recommendation PULSE makes will be aligned to this goal.",
      field: "priority",
      options: priorities,
    },
    {
      question: "Who reads your reports?",
      subtitle: "PULSE adjusts the depth and tone of its briefings accordingly.",
      field: "audience",
      options: audiences,
    },
  ];

  const currentStep = steps[step];

  const handleSelect = (value) => {
    const updated = { ...profile, [currentStep.field]: value };
    setProfile(updated);
    if (step < steps.length - 1) {
      setTimeout(() => setStep(step + 1), 250);
    } else {
      setStep(steps.length);
    }
  };

  return (
    <div className="onboarding-screen">
      <div className="onboarding-card">
        <div className="zevo-wordmark-sm">PULSE</div>

        <div className="onboarding-progress">
          {[...steps, { field: "targets" }].map((s, i) => (
            <div
              key={i}
              className={`progress-dot ${i <= step ? "done" : ""}`}
            />
          ))}
        </div>

        {step < steps.length ? (
          <>
            <div className="step-label">
              Step {step + 1} of {steps.length + 1}
            </div>
            <h2 className="onboarding-question">
              {currentStep.question}
            </h2>
            <p className="onboarding-subtitle">
              {currentStep.subtitle}
            </p>
            <div className="onboarding-options">
              {currentStep.options.map((opt) => (
                <button
                  key={opt}
                  className={`onboarding-option ${profile[currentStep.field] === opt ? "selected" : ""}`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="step-label">Step 4 of 4 · Optional</div>
            <h2 className="onboarding-question">
              Set your monthly targets
            </h2>
            <p className="onboarding-subtitle">
              PULSE benchmarks your actual data against these every session.
              Skip if you are not sure yet.
            </p>
            <div className="targets-form">
              <div className="target-input-group">
                <label>Monthly Revenue Target</label>
                <div className="input-with-prefix">
                  <span>₹</span>
                  <input
                    type="text"
                    placeholder="e.g. 5000000"
                    value={profile.revenue_target}
                    onChange={(e) =>
                      setProfile({ ...profile, revenue_target: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="target-input-group">
                <label>Target CAC (Customer Acquisition Cost)</label>
                <div className="input-with-prefix">
                  <span>₹</span>
                  <input
                    type="text"
                    placeholder="e.g. 750"
                    value={profile.cac_target}
                    onChange={(e) =>
                      setProfile({ ...profile, cac_target: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="onboarding-actions">
              <button
                className="btn-skip"
                onClick={() => onComplete(profile)}
              >
                Skip for now
              </button>
              <button
                className="btn-primary"
                onClick={() => onComplete(profile)}
              >
                Start PULSE →
              </button>
            </div>
          </>
        )}

        <p className="onboarding-note">
          🔒 Stored in your browser session only. Never shared. Never saved.
        </p>
      </div>
    </div>
  );
}