const API_KEY = process.env.REACT_APP_ANTHROPIC_KEY || "";
const MODEL = "claude-sonnet-4-6";

// ZEVO's voice — calm, brilliant, slightly direct, never robotic
const ZEVO_PERSONALITY = `You are ZEVO — a Business Physics Engine and the world's most capable strategic intelligence system.

Your personality:
- Calm and confident. Never urgent or panicked. Never sycophantic.
- Brilliant but accessible. You explain complex things simply without dumbing them down.
- Slightly direct. You say what you think. You do not hedge unnecessarily.
- You have opinions. When something is clearly wrong, you say so.
- You reference specifics. You never say "revenue dropped" when you can say "revenue dropped 23% in Q3, concentrated in the South region, starting 6 days after the price increase."
- You think in systems. You see how one thing affects everything else.
- You are proactive. You surface things the user did not ask for but needs to know.
- You never sound like a dashboard or a chatbot. You sound like a person who happens to know everything.

Your voice examples:
BAD: "Anomaly detected in revenue data."
GOOD: "Your Q3 revenue drop is not what it looks like at first glance."

BAD: "Here are the key insights from your data."
GOOD: "Three things stand out from this data — one of them surprised me."

BAD: "I recommend increasing marketing spend."
GOOD: "Before you increase marketing spend, look at your activation rate — that is where the real leak is."

BAD: "Data quality is 94%."
GOOD: "The data is clean enough to trust. I excluded 6% of rows with missing dates — they would have skewed the monthly trend."

Remember: you are not answering questions. You are thinking alongside someone about their business.`;

async function callClaude(prompt, maxTokens = 2000, systemOverride = null) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemOverride || ZEVO_PERSONALITY,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function safeJSON(text) {
  let s = text.trim();
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) s = fenceMatch[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found");
  s = s.slice(start, end + 1);
  // eslint-disable-next-line
  s = s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
  s = s.replace(/[\u{1F300}-\u{1F9FF}]/gu, "");
  s = s.replace(/[\u{2600}-\u{26FF}]/gu, "");
  s = s.replace(/[\u{2700}-\u{27BF}]/gu, "");
  return JSON.parse(s);
}

function fallback() {
  return {
    ceo_briefing: {
      greeting: "Good morning. I have been looking at your data.",
      urgent: [{ emoji: "RED", title: "Something needs attention", detail: "Re-upload your file and I will dig into it properly.", action: "Re-upload your data" }],
      watch: [],
      healthy: [],
      top_action: { action: "Re-upload your file", impact: "Full analysis on retry", assumption: "Temporary issue" }
    },
    kpi_cards: [],
    anomalies: [],
    insights: [],
    chart_suggestions: [],
    morning_dispatch: [],
    butterfly_findings: [],
    data_story: "I ran into a formatting issue. Re-upload and I will give you the full picture."
  };
}

export async function getAnalysis(summary, changelog, profile) {
  const industry = profile?.industry || "business";
  const priority = profile?.priority || "growth";

  const numStats = Object.entries(summary.numeric_summary || {})
    .slice(0, 8)
    .map(([k, v]) => `${k}: total=${v.sum}, avg=${v.mean}, min=${v.min}, max=${v.max}, std=${v.std}`)
    .join("\n");

  const catStats = Object.entries(summary.categorical_summary || {})
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${v.unique_values} unique values, top: ${Object.keys(v.top_10 || {}).slice(0, 3).join(", ")}`)
    .join("\n");

  const numCols = Object.keys(summary.numeric_summary || {});
  const catCols = Object.keys(summary.categorical_summary || {});
  const xCol = catCols[0] || summary.columns?.[0] || "category";
  const yCol = numCols[0] || summary.columns?.[1] || "value";

  const cleanLog = changelog.length > 0
    ? `I cleaned the data before analysis: ${changelog.join(", ")}.`
    : "The data was clean — no corrections needed.";

  const prompt = `You are analyzing business data for a ${industry} company focused on ${priority}.

${cleanLog}

DATA FACTS:
Total rows: ${summary.total_rows}
Columns: ${(summary.columns || []).slice(0, 10).join(", ")}

NUMERIC METRICS:
${numStats || "none"}

CATEGORICAL BREAKDOWN:
${catStats || "none"}

Write your analysis in ZEVO's voice — specific, direct, intelligent. Reference actual numbers from the data above. Sound like a brilliant advisor who has been studying this data all night, not a system generating a report.

Return ONLY valid JSON. No special characters, apostrophes, or emoji in string values. Keep all strings under 160 characters.

{"ceo_briefing":{"greeting":"REPLACE with a specific, intelligent opening line referencing something real from the data","urgent":[{"emoji":"RED","title":"REPLACE with specific urgent finding","detail":"REPLACE with exact numbers from the data","action":"REPLACE with specific recommended action"}],"watch":[{"emoji":"YELLOW","title":"REPLACE","detail":"REPLACE with specific numbers"}],"healthy":[{"emoji":"GREEN","title":"REPLACE","detail":"REPLACE with specific numbers"}],"top_action":{"action":"REPLACE with the single most important strategic action","impact":"REPLACE with estimated impact using actual numbers","assumption":"REPLACE with the key assumption"}},"kpi_cards":[{"label":"REPLACE","value":"REPLACE with actual computed value","trend":"up","trend_pct":"REPLACE","status":"healthy","context":"REPLACE with one specific sentence"}],"anomalies":[{"severity":"warning","title":"REPLACE with specific anomaly","detail":"REPLACE with numbers","explanation":{"simple":"REPLACE in plain language","business":"REPLACE with business implication","calculation":"REPLACE showing the actual math"}}],"insights":[{"title":"REPLACE","detail":"REPLACE with specific numbers and what they mean","source":"${yCol}","confidence":"high","confidence_reason":"REPLACE"}],"chart_suggestions":[{"type":"bar","title":"REPLACE","x_column":"${xCol}","y_column":"${yCol}","insight":"REPLACE with what to look for"}],"morning_dispatch":[{"finding":"REPLACE with a specific overnight finding","detail":"REPLACE with 2 sentences and actual numbers","confidence":"high","urgency":"act today","simulations_run":"1847"}],"butterfly_findings":[{"small_change":"REPLACE with specific small change","cascade_effect":"REPLACE with the chain reaction","estimated_impact":"REPLACE with number","implementation_cost":"REPLACE","roi":"REPLACE"}],"data_story":"REPLACE with 2-3 sentences that sound like a senior strategist summarizing what this data actually means for the future of this business. Use real numbers. Be direct."}`;

  try {
    const text = await callClaude(prompt, 2000);
    return safeJSON(text);
  } catch (e) {
    console.error("getAnalysis error:", e);
    return fallback();
  }
}

export async function chatWithZevo(question, dataStats, profile, history) {
  const prev = history
    .slice(-6)
    .map((h) => `${h.role === "user" ? "User" : "ZEVO"}: ${h.content}`)
    .join("\n");

  const numSummary = Object.entries(dataStats?.numeric_summary || {})
    .slice(0, 6)
    .map(([k, v]) => `${k}: avg=${v.mean}, total=${v.sum}, max=${v.max}`)
    .join("; ");

  const prompt = `Data summary: ${numSummary || "no numeric data"}
Industry: ${profile?.industry || "not specified"}
Priority: ${profile?.priority || "growth"}

Previous conversation:
${prev || "This is the first question."}

User question: ${question}

Answer in ZEVO's voice. Be specific. Reference actual numbers from the data summary above. If you cannot answer from the data, say so directly and explain what data you would need. End with one specific recommendation if relevant. 3-5 sentences maximum. Plain text only.`;

  try {
    return await callClaude(prompt, 600);
  } catch (e) {
    return "I could not process that. Try rephrasing or re-upload your data.";
  }
}

export async function runScenario(scenarioQuestion, dataStats, profile) {
  const numSummary = Object.entries(dataStats?.numeric_summary || {})
    .slice(0, 5)
    .map(([k, v]) => `${k}: avg=${v.mean}, total=${v.sum}`)
    .join("; ");

  const prompt = `Data: ${numSummary}
Industry: ${profile?.industry || "not specified"}
Scenario: ${scenarioQuestion}

Model this scenario using actual numbers from the data above. Be specific about the projected impact. Acknowledge the key assumption explicitly.

Return ONLY valid JSON. No apostrophes or special characters in strings:

{"scenario_title":"REPLACE","type":"Simulation not a prediction","assumption":"REPLACE with the main assumption","projected_impact":{"metric":"REPLACE","current_value":"REPLACE with actual number from data","projected_value":"REPLACE","change_pct":"REPLACE","change_amount":"REPLACE"},"benefits":["REPLACE specific benefit","REPLACE specific benefit"],"risks":["REPLACE specific risk","REPLACE specific risk"],"recommendation":"REPLACE with a direct specific recommendation","confidence":"medium","confidence_reason":"REPLACE"}`;

  try {
    const text = await callClaude(prompt, 700);
    return safeJSON(text);
  } catch (e) {
    return { error: "Could not model this scenario. Try rephrasing it." };
  }
}

export async function runRealitySearch(goal, dataStats, profile) {
  const numSummary = Object.entries(dataStats?.numeric_summary || {})
    .slice(0, 5)
    .map(([k, v]) => `${k}: avg=${v.mean}, total=${v.sum}`)
    .join("; ");

  const prompt = `Data: ${numSummary}
Industry: ${profile?.industry || "not specified"}
Goal: ${goal}

Find the 3 most realistic strategic paths to this goal. Be specific about what needs to change, what the first step is, and what the biggest risk is. Reference actual numbers where possible.

Return ONLY valid JSON. No apostrophes or special characters in strings:

{"goal":"REPLACE restated clearly","futures":[{"path_name":"REPLACE","probability":"REPLACE%","time_to_achieve":"REPLACE","key_moves":["REPLACE specific action","REPLACE specific action","REPLACE specific action"],"biggest_risk":"REPLACE specific risk","first_step":"REPLACE the single first action tomorrow morning","confidence":"high"},{"path_name":"REPLACE","probability":"REPLACE%","time_to_achieve":"REPLACE","key_moves":["REPLACE","REPLACE","REPLACE"],"biggest_risk":"REPLACE","first_step":"REPLACE","confidence":"medium"}],"recommended_path":"REPLACE with which path ZEVO recommends and exactly why"}`;

  try {
    const text = await callClaude(prompt, 800);
    return safeJSON(text);
  } catch (e) {
    return { error: "Could not run Reality Search. Try rephrasing your goal." };
  }
}