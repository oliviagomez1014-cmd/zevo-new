import { useState } from "react";
import Upload from "./components/Upload";
import Onboarding from "./components/Onboarding";
import CEOMode from "./components/CEOMode";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import { readFile, cleanData, computeSummary, computeConfidence, groupAndSum } from "./utils/dataEngine";
import { getAnalysis } from "./utils/claudeApi";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("upload");
  const [rawRows, setRawRows] = useState(null);
  const [profile, setProfile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loadingStep, setLoadingStep] = useState("");
  const [mode, setMode] = useState("autopilot");
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);
  const [isFirstTime] = useState(true);

  const handleFileSelected = async (file) => {
    setError(null);
    try {
      setLoadingStep("Reading your file...");
      const rows = await readFile(file);
      if (!rows.length) {
        setError("This file appears to be empty.");
        return;
      }
      setRawRows(rows);
      if (isFirstTime && !profile) {
        setScreen("onboarding");
      } else {
        runAnalysis(rows, profile);
      }
    } catch (err) {
      setError("Could not read this file. Make sure it is a valid Excel or CSV file.");
    }
  };

  const handleOnboardingComplete = (profileData) => {
    setProfile(profileData);
    runAnalysis(rawRows, profileData);
  };

  const runAnalysis = async (rows, profileData) => {
    setScreen("loading");
    setError(null);

    try {
      setLoadingStep("Cleaning and normalising data...");
      const { rows: cleanRows, changelog } = cleanData(rows);

      setLoadingStep("Computing statistics...");
      const summary = computeSummary(cleanRows);
      const confidence = computeConfidence(cleanRows);

      setLoadingStep("ZEVO is activating its engines...");
      const aiAnalysis = await getAnalysis(summary, changelog, profileData);

      setLoadingStep("Building your strategic brief...");
      const chartData = {};
      (aiAnalysis.chart_suggestions || []).forEach((chart) => {
        const key = `${chart.x_column}_${chart.y_column}`;
        if (chart.x_column && chart.y_column) {
          try {
            chartData[key] = groupAndSum(cleanRows, chart.x_column, chart.y_column);
          } catch (e) {}
        }
      });

      const fullAnalysis = {
        ...aiAnalysis,
        data_stats: summary,
        confidence,
        changelog,
        columns: summary.columns,
        chart_data: chartData,
      };

      setAnalysis(fullAnalysis);
      setActiveTab("overview");
      setScreen("ceo");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
      setScreen("upload");
    }
  };

  const handleSidebarNav = (tab) => {
    const dashboardTabs = ["overview", "anomalies", "insights", "charts", "scenarios", "reality"];
    if (tab === "briefing") {
      setScreen("ceo");
    } else if (dashboardTabs.includes(tab)) {
      setActiveTab(tab);
      setScreen("dashboard");
    } else {
      setActiveTab(tab);
      setScreen("dashboard");
    }
  };

  if (screen === "loading") {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-logo">
            <span className="loading-logo-cursive">Z</span>
            <span className="loading-logo-bold">EVO</span>
          </div>
          <div className="loading-spinner" />
          <div className="loading-step">{loadingStep}</div>
          <p className="loading-sub">
            Your data never leaves your browser. Processing locally.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {screen === "upload" && (
        <Upload onFileSelected={handleFileSelected} error={error} />
      )}

      {screen === "onboarding" && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {screen === "ceo" && analysis && (
        <div className="app-shell">
          <Sidebar
            activeTab="briefing"
            onTabChange={handleSidebarNav}
          />
          <div className="main-content">
            <CEOMode
              analysis={analysis}
              profile={profile}
              onViewDashboard={() => {
                setActiveTab("overview");
                setScreen("dashboard");
              }}
              onNewUpload={() => {
                setScreen("upload");
                setAnalysis(null);
                setRawRows(null);
              }}
            />
          </div>
        </div>
      )}

      {screen === "dashboard" && analysis && (
        <div className="app-shell">
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleSidebarNav}
          />
          <div className="main-content">
            <Dashboard
              analysis={analysis}
              profile={profile}
              mode={mode}
              onModeChange={setMode}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onNewUpload={() => {
                setScreen("upload");
                setAnalysis(null);
                setRawRows(null);
              }}
              onCEOMode={() => setScreen("ceo")}
            />
          </div>
        </div>
      )}
    </div>
  );
}