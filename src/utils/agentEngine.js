// agentEngine.js — Full natural language command parser for ZEVO Agent

// Named recipients the agent can recognise
function extractRecipient(text) {
  const patterns = [
    /(?:to|send to|email|tell|notify)\s+(?:mr\.?|ms\.?|dr\.?|mrs\.?)?\s*([a-z]+)(?:\s+in\s+the\s+([a-z\s]+)(?:dept|department|team))?/i,
    /(?:mr\.?|ms\.?|dr\.?)\s+([a-z]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return { name: m[1], dept: m[2] || null };
  }
  return null;
}

function extractChartColumns(text) {
  const colPattern = /(?:for|of|showing|with|between)\s+([a-z\s,]+?)(?:\s+and\s+|\s+vs\.?\s+|$)/gi;
  const matches = [];
  let m;
  while ((m = colPattern.exec(text)) !== null) {
    matches.push(...m[1].split(/,|\band\b/).map((s) => s.trim()).filter(Boolean));
  }
  return matches;
}

export function parseCommand(command) {
  const c = command.toLowerCase();
  const steps = [];

  // Upload / file
  if (c.includes("upload") || c.includes("open file") || c.includes("browse") || c.includes("new file") || c.includes("load file")) {
    steps.push({ action: "TRIGGER_UPLOAD", label: "Opening file picker" });
  }

  // Analysis / brief
  if (c.includes("analys") || c.includes("brief") || c.includes("morning") || (c.includes("summary") && !c.includes("executive summary"))) {
    steps.push({ action: "SHOW_BRIEF", label: "Showing Morning Brief" });
  }

  // Charts / dashboard / visualisation
  if (c.includes("chart") || c.includes("dashboard") || c.includes("graph") || c.includes("visual") || c.includes("plot")) {
    const cols = extractChartColumns(c);
    steps.push({ action: "SHOW_CHARTS", label: "Opening Charts", columns: cols });
  }

  // Anomalies / risks
  if (c.includes("anomal") || c.includes("risk") || c.includes("issue") || c.includes("problem") || c.includes("flag")) {
    steps.push({ action: "SHOW_ANOMALIES", label: "Opening Anomalies" });
  }

  // Insights / recommendations
  if (c.includes("insight") || c.includes("recommend")) {
    steps.push({ action: "SHOW_INSIGHTS", label: "Opening Insights" });
  }

  // Scenarios
  if (c.includes("scenario") || c.includes("what if") || c.includes("simulat")) {
    steps.push({ action: "SHOW_SCENARIOS", label: "Opening Scenario Simulator" });
  }

  // Reality search
  if (c.includes("reality") || c.includes("future") || c.includes("strategic path")) {
    steps.push({ action: "SHOW_REALITY", label: "Opening Reality Search" });
  }

  // Compare files
  if (c.includes("compar") || c.includes(" vs ") || c.includes("versus") || c.includes("difference")) {
    steps.push({ action: "OPEN_COMPARE", label: "Opening Multi-File Comparison" });
  }

  // PPT / PowerPoint
  if (c.includes("ppt") || c.includes("powerpoint") || c.includes("slides") || c.includes("presentation")) {
    steps.push({ action: "EXPORT_PPTX", label: "Generating PowerPoint presentation" });
  }

  // PDF
  if ((c.includes("pdf") || c.includes("download report") || (c.includes("export") && !c.includes("center") && !c.includes("ppt"))) && !steps.find(s => s.action === "EXPORT_PPTX")) {
    steps.push({ action: "EXPORT_PDF", label: "Generating PDF report" });
  }

  // Export center
  if (c.includes("export center") || c.includes("all formats") || c.includes("export options")) {
    steps.push({ action: "OPEN_EXPORT_CENTER", label: "Opening Export Center" });
  }

  // Email / send
  if (c.includes("email") || c.includes("mail") || c.includes("send") || c.includes("share")) {
    const recipient = extractRecipient(c);
    steps.push({
      action: "DRAFT_EMAIL",
      label: recipient ? `Drafting email to ${recipient.name}${recipient.dept ? ` (${recipient.dept})` : ""}` : "Drafting email",
      recipient,
    });
  }

  // Question / chat
  const isQuestion = /\b(what|why|how|which|who|when|where|is|are|was|were|can|will|should)\b/.test(c) || c.endsWith("?");
  const hasChatAction = isQuestion && !steps.some((s) => ["DRAFT_EMAIL", "EXPORT_PPTX", "EXPORT_PDF"].includes(s.action));
  if (hasChatAction) {
    steps.push({ action: "CHAT", label: "Answering your question", query: command });
  }

  // Fallback
  if (steps.length === 0) {
    steps.push({ action: "CHAT", label: "Asking ZEVO", query: command });
  }

  return steps;
}

export function buildEmailDraft(analysis, recipientEmail = "", recipientName = "") {
  const briefing = analysis?.ceo_briefing || {};
  const urgent = (briefing.urgent || []).map((i) => `- ${i.title}: ${i.detail}`).join("\n");
  const watch = (briefing.watch || []).map((i) => `- ${i.title}: ${i.detail}`).join("\n");
  const insights = (analysis?.insights || []).slice(0, 3).map((i) => `- ${i.title}: ${i.detail}`).join("\n");
  const kpis = (analysis?.kpi_cards || []).slice(0, 4).map((k) => `- ${k.label}: ${k.value} (${k.trend})`).join("\n");

  const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";
  const subject = `ZEVO Strategic Brief — ${new Date().toLocaleDateString("en-IN")}`;

  const body = `${greeting}

Please find below today's strategic brief generated by ZEVO, our Business Physics Engine, based on the latest data (${analysis?.data_stats?.total_rows?.toLocaleString() || 0} rows analysed).

─────────────────────────────────
URGENT ITEMS
─────────────────────────────────
${urgent || "Nothing urgent flagged today."}

─────────────────────────────────
ITEMS TO WATCH
─────────────────────────────────
${watch || "No watch items at this time."}

─────────────────────────────────
KEY METRICS
─────────────────────────────────
${kpis || "No KPI data available."}

─────────────────────────────────
KEY INSIGHTS & RECOMMENDATIONS
─────────────────────────────────
${insights || "No insights generated yet."}

─────────────────────────────────
STRATEGIC SUMMARY
─────────────────────────────────
${analysis?.data_story || ""}

─────────────────────────────────
Generated automatically by ZEVO.
Employees work 9 to 5. ZEVO works 5 to 9.`;

  const mailto = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, mailto };
}