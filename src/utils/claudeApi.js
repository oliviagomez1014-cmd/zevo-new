// eslint-disable-next-line
const API_KEY = process.env.REACT_APP_ANTHROPIC_KEY || "";
const MODEL = "claude-sonnet-4-6";

async function callClaude(prompt, maxTokens = 1500) {
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
  // Strip everything that can break JSON
  let s = text.trim();

  // Pull out JSON block from markdown if wrapped
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) s = fenceMatch[1].trim();

  // Find outermost braces
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found");
  s = s.slice(start, end + 1);

  // Remove control characters except newline and tab
  // eslint-disable-next-line
  s = s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");

  // Remove emojis entirely
  s = s.replace(/[\u{1F300}-\u{1F9FF}]/gu, "");
  s = s.replace(/[\u{2600}-\u{26FF}]/gu, "");
  s = s.replace(/[\u{2700}-\u{27BF}]/gu, "");

  return JSON.parse(s);
}

function fallback() {
  return {
    ceo_briefing: {
      greeting: "Good morning. ZEVO has analysed your data.",
      urgent: [{ emoji: "RED", title: "Analysis Issue", detail: "Could not fully parse the response. Please try re-uploading.", action: "Re-upload your file" }],
      watch: [],
      healthy: [],
      top_action: { action: "Re-upload your file", impact: "Full analysis available on retry", assumption: "Temporary issue" }
    },
    kpi_cards: [],
    anomalies: [],
    insights: [],
    chart_suggestions: [],
    morning_dispatch: [],
    butterfly_findings: [],
    data_story: "ZEVO encountered a parsing issue. Please re-upload your file."
  };
}

export async function getAnalysis(summary, changelog, profile) {
  const industry = profile?.industry || "Not specified";
  const priority = profile?.priority || "Growth";

  const numStats = Object.entries(summary.numeric_summary || {})
    .slice(0, 6)
    .map(([k, v]) => `${k}: total=${v.sum}, avg=${v.mean}, min=${v.min}, max=${v.max}`)
    .join("; ");

  const catStats = Object.entries(summary.categorical_summary || {})
    .slice(0, 4)
    .map(([k, v]) => `${k}: ${v.unique_values} values, top=${Object.keys(v.top_10 || {}).slice(0, 2).join(",")}`)
    .join("; ");

  const numCols = Object.keys(summary.numeric_summary || {});
  const catCols = Object.keys(summary.categorical_summary || {});

  const xCol = catCols[0] || summary.columns?.[0] || "category";
  const yCol = numCols[0] || summary.columns?.[1] || "value";

  const prompt = `You are ZEVO, a Business Physics Engine for ${industry} companies focused on ${priority}.

DATA FACTS:
Rows: ${summary.total_rows}
Columns: ${(summary.columns || []).slice(0, 8).join(", ")}
Numbers: ${numStats || "none"}
Categories: ${catStats || "none"}

Return ONLY the JSON below. Fill in ONLY the quoted placeholder values. Do NOT add fields. Do NOT use emoji characters. Do NOT use apostrophes. Use only ASCII characters in all string values.

{"ceo_briefing":{"greeting":"Good morning. Your company evolved while you were asleep.","urgent":[{"emoji":"RED","title":"REPLACE WITH URGENT ISSUE","detail":"REPLACE WITH SPECIFIC NUMBERS","action":"REPLACE WITH ACTION"}],"watch":[{"emoji":"YELLOW","title":"REPLACE WITH WATCH ITEM","detail":"REPLACE WITH NUMBERS"}],"healthy":[{"emoji":"GREEN","title":"REPLACE WITH POSITIVE","detail":"REPLACE WITH NUMBERS"}],"top_action":{"action":"REPLACE WITH TOP ACTION","impact":"REPLACE WITH IMPACT AND NUMBERS","assumption":"REPLACE WITH ASSUMPTION"}},"kpi_cards":[{"label":"REPLACE","value":"REPLACE","trend":"up","trend_pct":"REPLACE","status":"healthy","context":"REPLACE"}],"anomalies":[{"severity":"warning","title":"REPLACE","detail":"REPLACE","explanation":{"simple":"REPLACE","business":"REPLACE","calculation":"REPLACE"}}],"insights":[{"title":"REPLACE","detail":"REPLACE WITH NUMBERS","source":"${yCol}","confidence":"high","confidence_reason":"REPLACE"}],"chart_suggestions":[{"type":"bar","title":"REPLACE","x_column":"${xCol}","y_column":"${yCol}","insight":"REPLACE"}],"morning_dispatch":[{"finding":"REPLACE WITH FINDING","detail":"REPLACE WITH 2 SENTENCES","confidence":"high","urgency":"act today","simulations_run":"1284"}],"butterfly_findings":[{"small_change":"REPLACE","cascade_effect":"REPLACE","estimated_impact":"REPLACE WITH NUMBER","implementation_cost":"REPLACE","roi":"REPLACE"}],"data_story":"REPLACE WITH 2 SENTENCES USING ACTUAL NUMBERS FROM THE DATA."}

Replace every REPLACE placeholder with real analysis based on the data facts above. Keep all values concise and under 120 characters.`;

  try {
    const text = await callClaude(prompt, 1500);
    return safeJSON(text);
  } catch (e) {
    console.error("getAnalysis error:", e);
    return fallback();
  }
}

export async function chatWithZevo(question, dataStats, profile, history) {
  const prev = history
    .slice(-4)
    .map((h) => `${h.role === "user" ? "User" : "ZEVO"}: ${h.content}`)
    .join("\n");

  const prompt = `You are ZEVO, a Business Physics Engine.
Data summary: ${JSON.stringify(dataStats?.numeric_summary || {}).slice(0, 500)}
Previous: ${prev}
Question: ${question}
Answer in 3-4 sentences. Be specific with numbers. Plain text only.`;

  try {
    return await callClaude(prompt, 600);
  } catch (e) {
    return "ZEVO could not process that question. Please try again.";
  }
}

export async function runScenario(scenarioQuestion, dataStats, profile) {
  const numStats = Object.entries(dataStats?.numeric_summary || {})
    .slice(0, 4)
    .map(([k, v]) => `${k}: avg=${v.mean}, total=${v.sum}`)
    .join("; ");

  const prompt = `You are ZEVO Scenario Simulator.
Data: ${numStats}
Scenario: ${scenarioQuestion}

Return ONLY this JSON with placeholders replaced. No emoji. No apostrophes. ASCII only:

{"scenario_title":"REPLACE","type":"Simulation - not a prediction","assumption":"REPLACE","projected_impact":{"metric":"REPLACE","current_value":"REPLACE","projected_value":"REPLACE","change_pct":"REPLACE","change_amount":"REPLACE"},"benefits":["REPLACE","REPLACE"],"risks":["REPLACE","REPLACE"],"recommendation":"REPLACE","confidence":"medium","confidence_reason":"REPLACE"}`;

  try {
    const text = await callClaude(prompt, 700);
    return safeJSON(text);
  } catch (e) {
    return { error: "Could not run scenario. Please try again." };
  }
}

export async function runRealitySearch(goal, dataStats, profile) {
  const numStats = Object.entries(dataStats?.numeric_summary || {})
    .slice(0, 4)
    .map(([k, v]) => `${k}: avg=${v.mean}, total=${v.sum}`)
    .join("; ");

  const prompt = `You are ZEVO Reality Search.
Data: ${numStats}
Goal: ${goal}

Return ONLY this JSON with placeholders replaced. No emoji. No apostrophes. ASCII only:

{"goal":"REPLACE WITH RESTATED GOAL","futures":[{"path_name":"REPLACE","probability":"REPLACE%","time_to_achieve":"REPLACE","key_moves":["REPLACE","REPLACE","REPLACE"],"biggest_risk":"REPLACE","first_step":"REPLACE","confidence":"high"},{"path_name":"REPLACE","probability":"REPLACE%","time_to_achieve":"REPLACE","key_moves":["REPLACE","REPLACE","REPLACE"],"biggest_risk":"REPLACE","first_step":"REPLACE","confidence":"medium"}],"recommended_path":"REPLACE WITH RECOMMENDATION"}`;

  try {
    const text = await callClaude(prompt, 700);
    return safeJSON(text);
  } catch (e) {
    return { error: "Could not run Reality Search. Please try again." };
  }
}