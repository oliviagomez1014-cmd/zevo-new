import { useState, useEffect } from "react";
import { parseCommand, buildEmailDraft } from "../utils/agentEngine";
import { speakHuman, stopSpeaking } from "../utils/voiceEngine";
import { chatWithZevo } from "../utils/claudeApi";
import { generatePPTX } from "../utils/pptxExport";

export default function AgentBar({ analysis, profile, onNavigate, onExportPDF, onTriggerUpload, onOpenExportCenter, onOpenCompare }) {
  const [open, setOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [steps, setSteps] = useState([]);
  const [runningIndex, setRunningIndex] = useState(-1);
  const [emailDraft, setEmailDraft] = useState(null);
  const [listening, setListening] = useState(false);
  const [chatAnswer, setChatAnswer] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [doneSteps, setDoneSteps] = useState([]);

  useEffect(() => { return () => stopSpeaking(); }, []);

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice commands require Chrome."); return; }
    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = false;
    setListening(true);
    r.start();
    r.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setCommand(t);
      setListening(false);
      runCommand(t);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
  };

  const runCommand = async (cmdText) => {
    const text = cmdText || command;
    if (!text.trim()) return;

    const parsed = parseCommand(text);
    setSteps(parsed);
    setDoneSteps([]);
    setOpen(true);
    setEmailDraft(null);
    setChatAnswer(null);

    const stepCount = parsed.length;
    const intro = stepCount === 1
      ? "Got it. Working on it now."
      : `Understood. I will complete ${stepCount} tasks for you.`;
    speakHuman(intro);

    for (let i = 0; i < parsed.length; i++) {
      setRunningIndex(i);
      await new Promise((r) => setTimeout(r, 600));
      const step = parsed[i];

      try {
        if (step.action === "TRIGGER_UPLOAD") onTriggerUpload?.();
        if (step.action === "SHOW_BRIEF") { onNavigate?.("briefing"); speakHuman("Opening your Morning Brief."); }
        if (step.action === "SHOW_CHARTS") { onNavigate?.("charts"); speakHuman("Opening your Charts dashboard."); }
        if (step.action === "SHOW_ANOMALIES") { onNavigate?.("anomalies"); speakHuman("Here are the anomalies detected in your data."); }
        if (step.action === "SHOW_INSIGHTS") { onNavigate?.("insights"); speakHuman("Opening your key insights and recommendations."); }
        if (step.action === "SHOW_SCENARIOS") { onNavigate?.("scenarios"); }
        if (step.action === "SHOW_REALITY") { onNavigate?.("reality"); }
        if (step.action === "OPEN_EXPORT_CENTER") onOpenExportCenter?.();
        if (step.action === "OPEN_COMPARE") onOpenCompare?.();
        if (step.action === "EXPORT_PDF") {
          speakHuman("Generating your PDF report now.");
          onExportPDF?.();
        }
        if (step.action === "EXPORT_PPTX") {
          speakHuman("Building your PowerPoint presentation. This will take a few seconds.");
          await generatePPTX(analysis);
          speakHuman("Your PowerPoint is ready and downloading now.");
        }
        if (step.action === "DRAFT_EMAIL") {
          const r = step.recipient;
          const draft = buildEmailDraft(analysis, recipientEmail, r?.name || "");
          setEmailDraft({ ...draft, recipientHint: r });
          const who = r?.name ? `${r.name}${r.dept ? ` in the ${r.dept} department` : ""}` : "your manager";
          speakHuman(`I have drafted the email for ${who}. Please review it and add their email address before I open your mail client.`);
        }
        if (step.action === "CHAT") {
          setThinking(true);
          const response = await chatWithZevo(step.query, analysis?.data_stats, profile, []);
          setChatAnswer(response);
          speakHuman(response);
          setThinking(false);
        }
      } catch (e) {
        console.error(`Step ${step.action} failed:`, e);
      }

      setDoneSteps((prev) => [...prev, i]);
    }

    setRunningIndex(-1);
    if (!emailDraft) speakHuman("All done. Is there anything else you need?");
  };

  const confirmSendEmail = () => {
    const draft = buildEmailDraft(analysis, recipientEmail, emailDraft?.recipientHint?.name || "");
    speakHuman("Opening your email client now. You are in control of hitting send.");
    window.location.href = draft.mailto;
  };

  const closeAndStop = () => { stopSpeaking(); setOpen(false); };

  const getStepStatus = (i) => {
    if (doneSteps.includes(i)) return "done";
    if (i === runningIndex) return "active";
    return "pending";
  };

  return (
    <div className="agent-bar">
      <div className="agent-bar-row">
        <div className="agent-icon-wrap">
          <span className="agent-icon">◈</span>
          <span className="agent-label">ZEVO AGENT</span>
        </div>
        <input
          className="agent-input"
          placeholder='Say or type: "Analyse the data, give me a PDF and PPT, and send to Mr Ravi in finance"'
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runCommand()}
        />
        <button
          className={`voice-btn ${listening ? "voice-btn-active" : ""}`}
          onClick={handleVoice}
          title="Speak a command"
        >
          {listening ? "⏹" : "🎤"}
        </button>
        <button className="btn-primary" onClick={() => runCommand()}>Run →</button>
      </div>

      {open && (
        <div className="agent-plan">
          <div className="agent-plan-header">
            <span>EXECUTION PLAN — {steps.length} STEP{steps.length !== 1 ? "S" : ""}</span>
            <button className="btn-text" onClick={closeAndStop}>Close</button>
          </div>

          <div className="agent-steps">
            {steps.map((s, i) => {
              const status = getStepStatus(i);
              return (
                <div key={i} className={`agent-step ${status}`}>
                  <span className="agent-step-dot" />
                  <span className="agent-step-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="agent-step-label">{s.label}</span>
                  <span className="agent-step-status">
                    {status === "done" && "✓ Done"}
                    {status === "active" && "Running..."}
                    {status === "pending" && "Queued"}
                  </span>
                </div>
              );
            })}
          </div>

          {thinking && (
            <div className="agent-thinking">
              <div className="agent-thinking-dot" />
              ZEVO is thinking through your question...
            </div>
          )}

          {chatAnswer && (
            <div className="agent-chat-answer">
              <div className="agent-chat-label">ZEVO SAYS</div>
              <div className="agent-chat-text">{chatAnswer}</div>
              <button className="btn-ghost" style={{ marginTop: "8px", fontSize: "12px" }} onClick={() => speakHuman(chatAnswer)}>
                🔊 Read again
              </button>
            </div>
          )}

          {emailDraft && (
            <div className="agent-email-preview">
              <div className="agent-email-label">
                EMAIL DRAFT READY
                {emailDraft.recipientHint?.name && ` — FOR ${emailDraft.recipientHint.name.toUpperCase()}`}
                {emailDraft.recipientHint?.dept && ` (${emailDraft.recipientHint.dept.toUpperCase()})`}
              </div>
              <div className="agent-email-subject">{emailDraft.subject}</div>
              <div className="agent-email-body">{emailDraft.body}</div>
              <div className="agent-email-actions">
                <input
                  className="scenario-input"
                  placeholder={emailDraft.recipientHint?.name ? `${emailDraft.recipientHint.name.toLowerCase()}@company.com` : "recipient@company.com"}
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
                <button className="btn-primary" onClick={confirmSendEmail}>
                  ZEVO Send →
                </button>
              </div>
              <div className="agent-email-note">
                ZEVO never sends without your confirmation. Add the email address and click Send to open your mail client.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}